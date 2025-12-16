package main

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"io"
	"log"
	"mime/multipart"
	"net"
	"net/http"
	"net/url"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/ayushwasnothere/shrty/backend/b62"
	"github.com/ayushwasnothere/shrty/backend/db"
	"github.com/go-chi/chi"
	"github.com/go-chi/cors"
	"github.com/joho/godotenv"
)

type ShortenBody struct {
	URL            string `json:"url"`
	TurnstileToken string `json:"turnstileToken"`
}

type IPRateLimiter struct {
	Count   int
	Expires time.Time
}

var (
	ips = make(map[string]*IPRateLimiter)
	mu  sync.Mutex
)

func getClientIP(r *http.Request) string {
	// 1. Cloudflare
	if ip := r.Header.Get("CF-Connecting-IP"); ip != "" {
		return ip
	}

	// 2. X-Forwarded-For (first IP is original client)
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		ips := strings.Split(xff, ",")
		return strings.TrimSpace(ips[0])
	}

	// 3. X-Real-IP
	if ip := r.Header.Get("X-Real-IP"); ip != "" {
		return ip
	}

	// 4. Fallback
	host, _, err := net.SplitHostPort(r.RemoteAddr)
	if err == nil {
		return host
	}

	return r.RemoteAddr
}

func isValidURL(raw string) bool {
	u, err := url.ParseRequestURI(raw)
	if err != nil {
		return false
	}

	if u.Scheme != "http" && u.Scheme != "https" {
		return false
	}

	if u.Host == "" {
		return false
	}

	return true
}

func startIPCleanup(interval time.Duration) {
	go func() {
		ticker := time.NewTicker(interval)
		defer ticker.Stop()

		for range ticker.C {
			now := time.Now()

			mu.Lock()
			for ip, data := range ips {
				if now.After(data.Expires) {
					delete(ips, ip)
				}
			}
			mu.Unlock()
		}
	}()
}

func allowIP(ip string) bool {
	mu.Lock()
	defer mu.Unlock()

	now := time.Now()
	v, ok := ips[ip]

	if !ok || now.After(v.Expires) {
		ips[ip] = &IPRateLimiter{
			Count:   1,
			Expires: now.Add(time.Minute),
		}
		return true
	}

	if v.Count >= 5 {
		return false
	}

	v.Count++
	return true
}

func verifyTurnstile(token string) (bool, error) {
	secret := os.Getenv("TURNSTILE_SECRET")

	var buf bytes.Buffer
	writer := multipart.NewWriter(&buf)

	_ = writer.WriteField("secret", secret)
	_ = writer.WriteField("response", token)

	// OPTIONAL — only include in prod
	// if remoteIP != "" {
	// 	_ = writer.WriteField("remoteip", remoteIP)
	// }

	writer.Close()

	req, err := http.NewRequest(
		"POST",
		"https://challenges.cloudflare.com/turnstile/v0/siteverify",
		&buf,
	)
	if err != nil {
		return false, err
	}

	req.Header.Set("Content-Type", writer.FormDataContentType())

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)

	var result struct {
		Success    bool     `json:"success"`
		ErrorCodes []string `json:"error-codes"`
	}

	if err := json.Unmarshal(body, &result); err != nil {
		return false, err
	}

	return result.Success, nil
}

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found")
	}

	domain := os.Getenv("DOMAIN")
	dsn := os.Getenv("DATABASE_URL")

	startIPCleanup(1 * time.Minute)

	if err := db.Connect(dsn); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	r := chi.NewRouter()
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{
			"http://localhost:3000",
			"http://localhost:5173",
		},
		AllowedMethods:   []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	r.Post("/api/shorten", func(w http.ResponseWriter, r *http.Request) {
		bodyBytes, err := io.ReadAll(r.Body)
		if err != nil {
			http.Error(w, "Some error occured!", http.StatusBadRequest)
			log.Printf("Error reading body: %v", err)
			return
		}
		var jsonBody ShortenBody

		err = json.Unmarshal(bodyBytes, &jsonBody)

		if err != nil {
			http.Error(w, "Invalid JSON format", http.StatusBadRequest)
			log.Printf("Error unmarshalling JSON: %v", err)
			return
		}
		clientIP := getClientIP(r)

		if jsonBody.TurnstileToken == "" {
			http.Error(w, "Turnstile required", http.StatusForbidden)
			return
		}

		ok, err := verifyTurnstile(jsonBody.TurnstileToken)
		if err != nil || !ok {
			http.Error(w, "Bot verification failed", http.StatusForbidden)
			return
		}

		if !allowIP(clientIP) {
			http.Error(w, "Rate limit exceeded. Try again later.", http.StatusTooManyRequests)
			log.Printf("Rate limit exceeded for IP: %s", clientIP)
			return
		}

		if c := isValidURL(jsonBody.URL); !c {
			http.Error(w, "Invalid URL format", http.StatusBadRequest)
			log.Printf("Invalid URL format: %s", jsonBody.URL)
			return
		}

		var id int64
		err = db.DB.QueryRow("INSERT INTO urls (original_url) VALUES ($1) RETURNING id", jsonBody.URL).Scan(&id)

		if err != nil {
			http.Error(w, "Error inserting URL into database", http.StatusInternalServerError)
			log.Printf("Error inserting URL into database: %v", err)
			return
		}

		b62Id := b62.Encode(id)

		response := map[string]string{
			"shortened_url": domain + b62Id,
			"original_url":  jsonBody.URL,
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)

		if err := json.NewEncoder(w).Encode(response); err != nil {
			log.Println("Error encoding response to JSON:", err)
		}
		log.Printf("Shortened URL created for: %s", jsonBody.URL)
	})

	r.Get("/{shortenedId}", func(w http.ResponseWriter, r *http.Request) {
		shortenedId := chi.URLParam(r, "shortenedId")

		id, err := b62.Decode(shortenedId)
		if err != nil {
			http.Error(w, "Invalid shortened ID", http.StatusBadRequest)
			log.Printf("Invalid shortened ID: %s", shortenedId)
			return
		}

		var originalURL string
		err = db.DB.QueryRow("SELECT original_url FROM urls WHERE id = $1", id).Scan(&originalURL)

		if err != nil {
			if err == sql.ErrNoRows {
				http.Error(w, "Shortened URL not found", http.StatusNotFound)
				log.Printf("Shortened URL not found for ID: %d", id)
			} else {
				http.Error(w, "Error retrieving original URL", http.StatusInternalServerError)
				log.Printf("Error retrieving original URL for ID %d: %v", id, err)
			}
			return
		}

		http.Redirect(w, r, originalURL, http.StatusFound)
		log.Printf("Redirecting to original URL: %s for shortened ID: %s", originalURL, shortenedId)
	})

	r.NotFound(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(404)
		w.Write([]byte("route does not exist"))
	})

	r.MethodNotAllowed(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(405)
		w.Write([]byte("method is not valid"))
	})

	http.ListenAndServe(":8080", r)
}

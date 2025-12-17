# shrty

**Simplify Your Links**
Transform long URLs into clean, shareable links in seconds.

🚀 Live Demo: [**shrty.citxruzz.tech**](https://shrty.citxruzz.tech)

---

## 📖 About

**shrty** is a modern link shortener built for speed and simplicity. It features a high-performance Go backend and a responsive React frontend, secured with Cloudflare Turnstile to prevent abuse.

## 🛠️ Tech Stack

- **Frontend:** React, Vite
- **Backend:** Go (Golang)
- **Database:** PostgreSQL
- **Security:** Cloudflare Turnstile
- **Package Manager:** pnpm / npm / bun

## 📂 Repository Structure

This repository is organized into two main directories:

- `/backend` - Contains the Go API logic and database connections.
- `/frontend` - Contains the React user interface.

---

## 🚀 Getting Started

Follow these instructions to run the project locally.

### Prerequisites

- **Go** (v1.25 or higher)
- **Node.js** & **npm/pnpm/bun**
- **PostgreSQL** database instance running locally or in the cloud.

### 1. Backend Setup

Navigate to the backend directory:

```bash
cd backend

```

**Configuration**

Create a `.env` file in the `backend` directory based on the example below:

```env
TURNSTILE_SECRET=0x4AAAAAACHBdX-USx9N904K8JPerPzoqoM7c
PORT=8080
DATABASE_URL=postgres://postgres:password@localhost:5432/shrty
DOMAIN=localhost:8080

```

> **Note:** Ensure your PostgreSQL database is running and the `DATABASE_URL` matches your local credentials.

**Run the Server**

You can run the backend directly or build a binary:

```bash
# Run directly
go run main.go

# OR Build and Run
go build -o server main.go
./server

```

The server will start on port `8080` (or whichever port you specified in `.env`).

---

### 2. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
cd frontend

```

**Installation**

Install the dependencies using your preferred package manager:

```bash
# Using pnpm (Recommended)
pnpm install

# OR using npm
npm install

# OR using bun
bun install

```

**Configuration**

Create a `.env` file in the `frontend` directory:

```env
VITE_API_URL=http://localhost:8080
VITE_TURNSTILE_SITE_KEY=0x4AADFSAACHBdQP4sdfvNozzr1

```

**Run the Client**

Start the development server:

```bash
pnpm run dev
# or npm run dev / bun run dev

```

Open your browser and navigate to the URL provided in the terminal (usually `http://localhost:3000`).

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

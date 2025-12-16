package b62

const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"

func Encode(num int64) string {
	if num == 0 {
		return "0"
	}

	var result []byte
	for num > 0 {
		rem := num % 62
		result = append([]byte{chars[rem]}, result...)
		num = num / 62
	}
	return string(result)
}

func Decode(s string) (int64, error) {
	var result int64
	for i := 0; i < len(s); i++ {
		result *= 62
		if s[i] >= '0' && s[i] <= '9' {
			result += int64(s[i] - '0')
		} else if s[i] >= 'A' && s[i] <= 'Z' {
			result += int64(s[i]-'A') + 10
		} else if s[i] >= 'a' && s[i] <= 'z' {
			result += int64(s[i]-'a') + 36
		} else {
			return 0, nil
		}
	}
	return result, nil
}

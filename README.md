# 🔒 Lockr

Lockr is a premium, multi-user password manager featuring a sleek UI and robust backend architecture. Built to keep your digital life secure and organized, Lockr allows multiple users to safely store, categorize, and access their sensitive credentials in completely isolated vaults.

## ✨ Features

- **Multi-User Authentication**: Complete login and signup flows with isolated user sessions.
- **Isolated Vaults**: Each user gets their own dedicated vault; your data is strictly yours.
- **Master Password Protection**: A secondary layer of security prevents shoulder-surfing. You must enter your master password before viewing or editing sensitive credentials.
- **Dynamic Dashboard**: A beautiful, glassmorphic UI built with modern CSS and Phosphor Icons.
- **Real-time Search & Categorization**: Instantly filter your passwords by service name, email, or category (Personal, Browsing, Payments, etc.).
- **Full CRUD Operations**: Easily Add, Edit, Delete, and View your credentials.

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3, Vite
- **Backend**: Node.js, Express.js
- **Database**: SQLite3 (via `better-sqlite3`)
- **Icons**: Phosphor Icons

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine.

### Prerequisites

- [Node.js](https://nodejs.org/) (v16.0 or higher recommended)
- npm (comes with Node.js)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sayudh1505/Lockr.git
   cd Lockr
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the application**
   ```bash
   npm run dev:all
   ```
   > This single command uses `concurrently` to automatically start both the Express backend server (on port 3000) and the Vite frontend server (on port 5173).

4. Open your browser and navigate to `http://localhost:5173`. Create your first account!

## 🗄️ Database Architecture

Lockr uses a local SQLite database (`database.sqlite`) which is automatically generated upon the first run. It consists of:
- `users` table: Manages authentication credentials.
- `passwords` table: Stores individual vault items, linked securely to users via a foreign key relationship.

*Note: The local `database.sqlite` file is intentionally ignored by `.gitignore` to prevent pushing your private, local credentials to GitHub.*

## 🔒 Security Roadmap

While Lockr has a strong foundation, the following security enhancements are planned for a production-ready environment:
- Integrate `bcrypt` for one-way cryptographic hashing of user login passwords.
- Implement client-side AES-256 encryption for vault items so the server never sees plaintext passwords.
- Transition from `localStorage` sessions to HTTP-only secure cookies or JWTs.
- Isolate configuration (ports, secrets) using Environment variables (`.env`).

## 🤝 Contributing

Contributions, issues, and feature requests are always welcome! Feel free to fork the repository and submit a pull request.

## 📝 License

This project is open-source and available under the MIT License.
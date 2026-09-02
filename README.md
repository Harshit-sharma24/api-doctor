# 🩺 API Doctor

> A modern full-stack API testing and debugging platform built to send HTTP requests, inspect responses, and manage request history — all from one clean interface.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-API%20Doctor-00C7B7?style=for-the-badge)](https://api-doctorr.netlify.app/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/Harshit-sharma24/api-doctor)
[![Frontend](https://img.shields.io/badge/Frontend-Netlify-00C7B7?style=for-the-badge&logo=netlify)](https://api-doctorr.netlify.app/)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=for-the-badge)](https://api-doctor-swvo.onrender.com/)

---

## 🚀 Live Demo

🌐 **Try API Doctor:**  
https://api-doctorr.netlify.app/

🔗 **Backend Health Check:**  
https://api-doctor-swvo.onrender.com/

> ⚡ The backend is hosted on Render's free instance, so the first request after inactivity may take a little longer while the server wakes up.

---

## 📸 Overview

**API Doctor** is a full-stack API testing tool inspired by modern API clients such as Postman.

It allows developers to create HTTP requests, configure authentication and request data, execute APIs, and inspect detailed responses without leaving the browser.

The application also stores request history using MongoDB, making it easy to revisit and manage previous API requests.

---

## ✨ Features

### 🌐 HTTP Requests

- `GET`
- `POST`
- `PUT`
- `PATCH`
- `DELETE`
- Custom API URL support

### 🧩 Request Configuration

- Query parameters
- Custom headers
- JSON request body
- Form-data
- `x-www-form-urlencoded`
- Bearer Token authentication
- Basic Authentication
- Configurable request timeout

### 📊 Response Inspection

- HTTP status code
- Status text
- Response body
- Response headers
- Response time
- Automatic response scrolling
- Copy response functionality

### 🕘 Request History

- Automatically save executed requests
- View previous requests
- Load requests from history
- Delete individual history items
- Clear complete history

### ☁️ Production Deployment

- Frontend deployed on Netlify
- Backend deployed on Render
- MongoDB Atlas database
- Production frontend connected to live backend API

---

## 🛠️ Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS

### Backend

- Node.js
- Express.js
- TypeScript
- Mongoose

### Database

- MongoDB Atlas

### Deployment

- Netlify — Frontend
- Render — Backend
- GitHub — Source Control

---

## 🏗️ Architecture

```text
                    ┌─────────────────────┐
                    │      User           │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   React Frontend    │
                    │   TypeScript + Vite │
                    └──────────┬──────────┘
                               │
                               │ HTTP Request
                               ▼
                    ┌─────────────────────┐
                    │   Express Backend   │
                    │   Node.js + TS      │
                    └───────┬───────┬─────┘
                            │       │
                ┌───────────┘       └─────────────┐
                ▼                                 ▼
       ┌─────────────────┐              ┌─────────────────┐
       │  External APIs  │              │  MongoDB Atlas  │
       │ Request/Response│              │ Request History │
       └─────────────────┘              └─────────────────┘

👨‍💻 Author
Harshit Sharma

B.Tech CSIT Student | AI & Full-Stack Developer

I build AI-powered applications, full-stack web applications, developer tools, and SaaS projects.

Connect with me
🌐 Portfolio: https://harshitsharma24.netlify.app/
💼 LinkedIn: https://www.linkedin.com/in/harshit-sharma-199880396/
🐙 GitHub: https://github.com/Harshit-sharma24
📄 License

This project is licensed under the MIT License

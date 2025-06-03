# MiroTalk Admin

A secure and modern web-based dashboard designed to manage **[MiroTalk](https://docs.mirotalk.com/html/overview.html)** updates, configurations, and settings efficiently.

---

![admin](./frontend/assets/mirotalk-admin.png)

---

## 🚀 Quick Start (Local)

1. **Setup Backend**

    ```bash
    cp backend/config/index.template.js backend/config/index.js
    cp .env.template .env
    npm install
    npm start
    ```

2. **Open the Dashboard**

    Visit: [http://localhost:9999/admin](http://localhost:9999/admin)

    - **Username:** `admin`
    - **Password:** `admin`

---

## 🐳 Run with Docker

1. **Copy and configure your environment:**

    ```bash
    cp backend/config/index.template.js backend/config/index.js
    cp .env.template .env
    cp docker-compose.template.yml docker-compose.yml
    ```

2. **Build and start the container:**

    ```bash
    docker compose build
    docker compose up
    ```

3. **Access the dashboard:**  
   [http://localhost:9999/admin](http://localhost:9999/admin)

---

> ⚠️ **Security Notice**
>
> Please review and update the following `.env` settings to secure and manage your MiroTalk instance:
>
> ### 🔐 Admin Dashboard
>
> - Set `ADMIN_DASHBOARD_ENABLED=true` to enable the admin dashboard.
> - **Important:** Change the default credentials:
>
>     - `ADMIN_USERNAME`
>     - `ADMIN_PASSWORD`
>     - `ADMIN_JWT_SECRET`
>
> ### 🛠️ Manage Mode (APP_MANAGE_MODE)
>
> Choose the appropriate management mode based on how you're running MiroTalk:
>
> - **Local Device Management (via SSH)**
>   Set `APP_MANAGE_MODE=ssh` and configure:
>
>     - `SSH_HOST`
>     - `SSH_PORT`
>     - `SSH_USERNAME`
>     - `SSH_PASSWORD` or `SSH_PRIVATE_KEY`
>
> - **Self-Hosted with Docker**
>   Set `APP_MANAGE_MODE=docker`
> - **Self-Hosted with PM2**
>   Set `APP_MANAGE_MODE=pm2`
>
> ---
>
> ✅ Keeping these values updated ensures your MiroTalk instance is secure and manageable.

---

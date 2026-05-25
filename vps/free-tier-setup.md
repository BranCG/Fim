# Guía de Despliegue 100% Gratis: Google Cloud + DuckDNS 🚀

Esta guía paso a paso te explica cómo levantar tu servidor de producción de **Fim** sin pagar absolutamente nada ($0 USD), utilizando la capa gratuita de por vida de **Google Cloud Platform (GCP)** y un dominio gratuito de **DuckDNS**.

---

## 1. Obtener un Dominio Gratis con DuckDNS

Para instalar el certificado de seguridad SSL (HTTPS), necesitamos un nombre de dominio. DuckDNS te regala uno en segundos.

1. Ve a [DuckDNS.org](https://www.duckdns.org) e inicia sesión con Google, GitHub o Reddit.
2. En la sección **subdomains**, escribe el nombre que quieras para tu API (por ejemplo: `fim-api`).
3. Haz clic en **add domain**. 
4. Esto te creará el dominio gratuito `fim-api.duckdns.org`.
5. Deja esta pestaña abierta. Más adelante, cuando Google Cloud nos dé la dirección IP del servidor, regresaremos aquí a guardar la IP en el campo "ip" de tu dominio DuckDNS.

---

## 2. Crear Servidor Gratis en Google Cloud Platform (GCP)

Google Cloud ofrece una máquina virtual virtual (VPS) gratis de por vida siempre que se elija la configuración correcta.

### Paso A: Registrarse y entrar a la consola
1. Entra a [console.cloud.google.com](https://console.cloud.google.com).
2. Regístrate o inicia sesión con tu cuenta de Google.
3. Te pedirá añadir una tarjeta de débito/crédito para verificar tu identidad. **No te cobrarán nada**. Google además te regala $300 USD de saldo inicial para probar servicios de pago, pero nosotros configuraremos la máquina de la capa gratuita para que no gaste saldo y dure de por vida.

### Paso B: Crear la Instancia de Servidor (Compute Engine)
1. En el menú lateral izquierdo, ve a **Compute Engine** > **Instancias de VM**.
2. Haz clic en **Crear Instancia**.
3. Configura exactamente los siguientes campos para asegurar que esté en la capa gratuita:
   * **Nombre**: `fim-api-server`
   * **Región**: Elige **`us-central1` (Iowa)**, **`us-east1` (Carolina del Sur)** o **`us-west1` (Oregón)**. *(La capa gratuita solo es válida en estas tres regiones)*.
   * **Zona**: Cualquiera de la región seleccionada (por ejemplo, `us-central1-a`).
   * **Configuración de máquina**:
     * Serie: **`E2`**
     * Tipo de máquina: **`e2-micro`** *(Tiene 2 vCPUs compartidas y 1 GB de memoria RAM. Es la única máquina gratis)*.
   * **Disco de arranque**:
     * Haz clic en **Cambiar**.
     * Sistema operativo: **Ubuntu**
     * Versión: **Ubuntu 20.04 LTS** o **Ubuntu 22.04 LTS (x86/64)**.
     * Tipo de disco de arranque: **Disco persistente estándar** *(No elijas SSD ni Equilibrado, ya que tienen costo)*.
     * Tamaño: **30 GB** *(La capa gratuita cubre hasta 30 GB de almacenamiento)*.
     * Haz clic en **Seleccionar**.
   * **Cortafuegos (Firewall)**:
     * Marca la casilla: **Permitir tráfico HTTP**
     * Marca la casilla: **Permitir tráfico HTTPS**
4. Haz clic en **Crear** (abajo a la izquierda). Tardará un par de minutos en encenderse.

---

## 3. Reservar IP Estática (Evitar que Google cambie tu IP)

Por defecto, Google cambia la dirección IP pública del servidor cada vez que se reinicia. Debemos hacerla permanente (estática) y gratuita.

1. En la consola de Google Cloud, escribe en el buscador de arriba **"Direcciones IP externas"** y selecciónalo.
2. Verás la IP temporal que se asignó a tu máquina `fim-api-server`.
3. En la columna **Tipo**, cambia de **Efímera** a **Estática**.
4. Te pedirá poner un nombre (ej. `fim-static-ip`). Escríbelo y haz clic en **Reservar**.
5. Copia la dirección IP que aparece (por ejemplo: `34.123.45.67`).

---

## 4. Apuntar tu Dominio DuckDNS a la IP de Google Cloud

1. Vuelve a la pestaña de [DuckDNS.org](https://www.duckdns.org).
2. Busca tu subdominio creado (`fim-api.duckdns.org`).
3. Pega la IP estática que copiaste en el campo de texto **ip**.
4. Haz clic en el botón **update ip**.
5. ¡Listo! A partir de ahora, cualquier solicitud a `fim-api.duckdns.org` se redirigirá automáticamente a tu servidor gratuito de Google Cloud.

---

## 5. Conectarte a tu Servidor mediante SSH

Para instalar el programa de Fim, debemos conectarnos por consola al servidor.

1. En la consola de Google Cloud, ve a la sección **Instancias de VM**.
2. En la fila de tu máquina `fim-api-server`, verás una columna llamada **Conectar**.
3. Haz clic en el botón **SSH**.
4. Se abrirá una ventana emergente con una terminal negra. Ya estás dentro de tu servidor virtual de forma remota.

---

## 6. Instalar y Levantar Fim en el Servidor

Dentro de la terminal negra de Google Cloud, ejecuta paso a paso los comandos descritos en el manual de instalación general:

```bash
# 1. Instalar actualizaciones y herramientas básicas
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# 2. Configurar el Firewall del servidor de forma segura
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
# (Presiona 'y' y Enter para confirmar el firewall)

# 3. Instalar Docker y Docker Compose
sudo apt install -y docker.io docker-compose
sudo systemctl enable --now docker

# 4. Clonar el repositorio del proyecto Fim
cd /var/www/
# Reemplaza la URL con tu repositorio de GitHub
sudo git clone https://github.com/tu-usuario/fim-app.git /var/www/Fim
sudo chown -R $USER:$USER /var/www/Fim

# 5. Crear el archivo de entorno de producción (.env)
nano /var/www/Fim/apps/api/.env
```
*En el editor que se abrirá, pega las credenciales reales de Supabase (PostgreSQL) y Upstash Redis, luego guarda presionando `Ctrl+O`, `Enter`, y sal con `Ctrl+X`.*

```bash
# 6. Levantar la aplicación con Docker en segundo plano
cd /var/www/Fim
sudo docker-compose up --build -d

# 7. Instalar Nginx y configurar el proxy inverso
sudo apt install -y nginx
```

### Configurar Nginx para tu dominio DuckDNS:
Edita el archivo de configuración en tu repositorio local o en el servidor para usar tu dominio de DuckDNS. Abre el archivo de configuración:
```bash
nano /var/www/Fim/vps/fim-api.conf
```
*Reemplaza todas las ocurrencias de `api.fim.cl` por tu dominio `fim-api.duckdns.org` y guarda.*

```bash
# Enlazar la configuración de Nginx y activar el sitio
sudo ln -sf /var/www/Fim/vps/fim-api.conf /etc/nginx/sites-enabled/fim-api
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx

# 8. Obtener e instalar el certificado SSL gratuito
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d fim-api.duckdns.org
# (Sigue las instrucciones en pantalla de Certbot: ingresa tu correo y acepta los términos)
```

¡Todo listo! Tu servidor estará funcionando al 100%, con HTTPS habilitado sobre un dominio gratuito y sin costo mensual para tu bolsillo.

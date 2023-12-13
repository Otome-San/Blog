const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

let loggedInUser = null;

// Ruta para manejar el registro de usuarios
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Lee los usuarios desde el archivo JSON
    const users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));

    // Verifica si el usuario o el correo electrónico ya existen en el archivo JSON
    const userExists = users.some(user => user.username === username || user.email === email);

    if (userExists) {
        // El usuario o el correo electrónico ya están registrados
        res.json({ success: false, message: 'El usuario o el correo electrónico ya están registrados' });
    } else {
        try {
            // Encripta la contraseña antes de almacenarla
            const hashedPassword = await bcrypt.hash(password, 10);

            // Registra al nuevo usuario en el archivo JSON con la contraseña encriptada
            users.push({ username, email, password: hashedPassword, posts: [] });

            // Guarda los usuarios actualizados en el archivo JSON
            fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

            res.json({ success: true, message: 'Registro exitoso' });
        } catch (error) {
            console.error('Error al encriptar la contraseña:', error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
});

// Ruta para manejar el inicio de sesión
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    // Lee los usuarios desde el archivo JSON
    const users = JSON.parse(fs.readFileSync('users.json', 'utf-8'));

    // Busca al usuario por el nombre de usuario
    const user = users.find(user => user.username === username);

    if (user) {
        // Compara la contraseña encriptada almacenada con la proporcionada
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            loggedInUser = user; // Almacena el usuario autenticado
            res.json({ success: true, message: 'Inicio de sesión exitoso' });
        } else {
            res.json({ success: false, message: 'Credenciales incorrectas' });
        }
    } else {
        res.json({ success: false, message: 'Credenciales incorrectas' });
    }
});

// Ruta para obtener el usuario actualmente autenticado
app.get('/user', (req, res) => {
    res.json(loggedInUser);
});

// Ruta para cerrar sesión
app.post('/logout', (req, res) => {
    loggedInUser = null; // Elimina el usuario autenticado
    res.json({ success: true, message: 'Cierre de sesión exitoso' });
});

// Ruta para manejar la creación de una nueva publicación
app.post('/create-post', (req, res) => {
    const { title, content } = req.body;

    // Verifica si hay un usuario autenticado
    if (loggedInUser) {
        // Agrega la nueva publicación al array de publicaciones del usuario
        loggedInUser.posts.push({ title, content });

        // Actualiza el archivo JSON con la nueva información
        fs.writeFileSync('users.json', JSON.stringify(users, null, 2));

        res.json({ success: true, message: 'Publicación creada exitosamente' });
    } else {
        res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
});

// Resto del código...

// Inicia el servidor
app.listen(PORT, () => {
    console.log(`Servidor en ejecución en http://localhost:${PORT}`);
});

const UsuarioModel = require('../models/UsuarioModel');
const bcrypt = require('bcryptjs');

const perfilController = {

    // Mostrar vista de perfil
    mostrar: async (req, res) => {
        try {
            // Obtenemos los datos frescos de la BD
            const usuario = await UsuarioModel.buscarPorId(req.session.usuario.id);
            res.render('perfil/index', { 
                title: 'Mi Perfil',
                usuarioData: usuario // Enviamos datos completos
            });
        } catch (error) {
            console.error(error);
            res.redirect('/');
        }
    },

    // Actualizar Nombre y Correo
    actualizarDatos: async (req, res) => {
        const { nombre_completo, email } = req.body;
        const idUsuario = req.session.usuario.id;

        try {
            await UsuarioModel.actualizarDatos(idUsuario, nombre_completo, email);
            
            // Actualizamos la sesión también para que se refleje el cambio de nombre en el menú
            req.session.usuario.nombre = nombre_completo;
            req.session.usuario.email = email;

            req.flash('mensajeExito', 'Datos actualizados correctamente');
            res.redirect('/perfil');

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al actualizar datos');
            res.redirect('/perfil');
        }
    },

    // Cambiar Contraseña
    cambiarPassword: async (req, res) => {
        const { password_actual, password_nueva, password_confirmar } = req.body;
        const idUsuario = req.session.usuario.id;

        try {
            // 1. Validar que las nuevas coincidan
            if (password_nueva !== password_confirmar) {
                req.flash('mensajeError', 'Las nuevas contraseñas no coinciden');
                return res.redirect('/perfil');
            }

            // 2. Obtener usuario para verificar la actual
            const usuario = await UsuarioModel.buscarPorId(idUsuario);

            // 3. Verificar contraseña actual
            const esValido = await bcrypt.compare(password_actual, usuario.password);
            if (!esValido) {
                req.flash('mensajeError', 'La contraseña actual es incorrecta');
                return res.redirect('/perfil');
            }

            // 4. Encriptar nueva y guardar
            const passwordHash = await bcrypt.hash(password_nueva, 10);
            await UsuarioModel.actualizarPassword(idUsuario, passwordHash);

            req.flash('mensajeExito', 'Contraseña cambiada exitosamente. Inicia sesión de nuevo.');
            
            // Cerramos sesión por seguridad
            req.session.destroy(() => {
                res.redirect('/auth/login');
            });

        } catch (error) {
            console.error(error);
            req.flash('mensajeError', 'Error al cambiar contraseña');
            res.redirect('/perfil');
        }
    }
};

module.exports = perfilController;
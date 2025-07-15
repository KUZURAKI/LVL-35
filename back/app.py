import os
import logging
import sqlite3
import re
import bcrypt
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import Flask, request, jsonify, session, send_file
from flask_cors import CORS
from io import BytesIO
from translations import translations

logging.basicConfig(
    filename='app.log',
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    encoding='utf-8'
)

app = Flask(__name__, template_folder='../front/templates', static_folder='../front/static')
app.secret_key = os.getenv('SECRET_KEY', 'your-secret-key-here')
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

app.config['MAIL_SERVER'] = os.getenv('MAIL_SERVER', 'smtp.yandex.ru')
app.config['MAIL_PORT'] = int(os.getenv('MAIL_PORT', 465))
app.config['MAIL_USE_SSL'] = os.getenv('MAIL_USE_SSL', 'True') == 'True'
app.config['MAIL_USERNAME'] = os.getenv('MAIL_USERNAME', 'your_email@yandex.ru')
app.config['MAIL_PASSWORD'] = os.getenv('MAIL_PASSWORD', 'your_password')
app.config['MAIL_DEFAULT_SENDER'] = os.getenv('MAIL_DEFAULT_SENDER', 'your_email@yandex.ru')

def get_translation(key):
    lang = session.get('lang', 'ru')
    return translations[lang].get(key, key)

@app.context_processor
def inject_translations():
    return dict(_=get_translation)

def send_registration_email(email, login, full_name):
    try:
        msg = MIMEMultipart()
        msg['From'] = app.config['MAIL_DEFAULT_SENDER']
        msg['To'] = email
        msg['Subject'] = get_translation('email_subject')

        lang = session.get('lang', 'ru')
        if lang == 'ru':
            body = f"""
            <h2>Добро пожаловать, {full_name}!</h2>
            <p>Вы успешно зарегистрировались на нашем сайте.</p>
            <p>Ваш логин: <strong>{login}</strong></p>
            <p>Спасибо за регистрацию!</p>
            """
        else:
            body = f"""
            <h2>Welcome, {full_name}!</h2>
            <p>You have successfully registered on our website.</p>
            <p>Your login: <strong>{login}</strong></p>
            <p>Thank you for registration!</p>
            """

        msg.attach(MIMEText(body, 'html'))

        with smtplib.SMTP_SSL(app.config['MAIL_SERVER'], app.config['MAIL_PORT']) as server:
            server.login(app.config['MAIL_USERNAME'], app.config['MAIL_PASSWORD'])
            server.send_message(msg)

        logging.info(f"Письмо с подтверждением отправлено на {email}")
        return True
    except smtplib.SMTPAuthenticationError:
        logging.error("Ошибка аутентификации при отправке письма")
        return False
    except smtplib.SMTPException as e:
        logging.error(f"Ошибка SMTP при отправке письма: {str(e)}")
        return False
    except Exception as e:
        logging.error(f"Неожиданная ошибка при отправке письма: {str(e)}")
        return False

def is_valid_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def is_valid_file(file):
    allowed_types = ['image/jpeg', 'image/png', 'image/gif']
    max_size = 2 * 1024 * 1024
    
    if file.mimetype not in allowed_types:
        return False, get_translation('invalid_file_type')
    if file.content_length > max_size:
        return False, get_translation('file_too_large')
    return True, ''

def is_valid_full_name(full_name):
    words = full_name.strip().split()
    if len(words) != 3:
        return False, get_translation('full_name_error')
    return True, ''

def is_strong_password(password):
    return (
        len(password) >= 8 and
        bool(re.search(r'\d', password)) and
        bool(re.search(r'[a-zA-Zа-яА-Я]', password)) and
        bool(re.search(r'[!@#$%^&*(),.?":{}|<>]', password))
    )

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def init_db():
    if not os.path.exists('database.db'):
        with sqlite3.connect('database.db') as conn:
            c = conn.cursor()
            c.execute('''CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                login TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                full_name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT NOT NULL,
                about TEXT NOT NULL,
                avatar BLOB
            )''')
            conn.commit()
        logging.info("База данных успешно инициализирована")

init_db()

@app.route('/set_language/<lang>')
def set_language(lang):
    if lang in ['ru', 'en']:
        session['lang'] = lang
    return '', 204

@app.route('/api/users', methods=['POST'])
def api_users():
    data = request.form
    login = data.get('login')
    password = data.get('password')
    confirm_password = data.get('confirm_password')
    full_name = data.get('full_name')
    email = data.get('email')
    phone = data.get('phone')
    about = data.get('about')
    avatar = request.files.get('avatar')

    logging.info(f"API: Попытка регистрации: login={login}")

    if not all([login, password, confirm_password, full_name, email, phone, about]):
        logging.warning("API: Не все обязательные поля заполнены")
        return jsonify({
            'status': 'error',
            'message': get_translation('all_fields_required')
        }), 400

    with sqlite3.connect('database.db') as conn:
        c = conn.cursor()
        c.execute('SELECT id FROM users WHERE login = ?', (login,))
        if c.fetchone():
            logging.warning(f"API: Логин {login} уже существует")
            return jsonify({
                'status': 'error',
                'message': get_translation('login_exists')
            }), 400

    is_valid, full_name_error = is_valid_full_name(full_name)
    if not is_valid:
        logging.warning(f"API: {full_name_error}")
        return jsonify({
            'status': 'error',
            'message': full_name_error
        }), 400

    if not is_valid_email(email):
        logging.warning(f"API: Неверный формат email={email}")
        return jsonify({
            'status': 'error',
            'message': get_translation('invalid_email')
        }), 400

    if password != confirm_password:
        logging.warning("API: Пароли не совпадают")
        return jsonify({
            'status': 'error',
            'message': get_translation('passwords_mismatch')
        }), 400

    if not is_strong_password(password):
        logging.warning("API: Пароль не соответствует требованиям")
        return jsonify({
            'status': 'error',
            'message': get_translation('weak_password')
        }), 400

    if avatar:
        is_valid, error_message = is_valid_file(avatar)
        if not is_valid:
            logging.warning(f"API: {error_message}")
            return jsonify({
                'status': 'error',
                'message': error_message
            }), 400
        avatar_data = avatar.read()
    else:
        logging.warning("API: Файл аватара не загружен")
        return jsonify({
            'status': 'error',
            'message': get_translation('avatar_required')
        }), 400

    try:
        hashed_password = hash_password(password)
        with sqlite3.connect('database.db') as conn:
            c = conn.cursor()
            c.execute('''INSERT INTO users (login, password, full_name, email, phone, about, avatar)
                        VALUES (?, ?, ?, ?, ?, ?, ?)''',
                     (login, hashed_password, full_name, email, phone, about, avatar_data))
            user_id = c.lastrowid
            conn.commit()
        
        email_sent = send_registration_email(email, login, full_name)
        if not email_sent:
            logging.warning(f"API: Не удалось отправить письмо на {email}")
        
        logging.info(f"API: Пользователь успешно зарегистрирован: login={login}, id={user_id}")
        return jsonify({
            'status': 'success',
            'message': get_translation('registration_success'),
            'data': {
                'id': user_id,
                'login': login,
                'full_name': full_name,
                'email': email,
                'phone': phone,
                'about': about
            },
            'email_sent': email_sent
        }), 201
    except Exception as e:
        logging.error(f"API: Ошибка при сохранении пользователя: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': get_translation('server_error')
        }), 500

@app.route('/avatar/<int:user_id>')
def get_avatar(user_id):
    try:
        with sqlite3.connect('database.db') as conn:
            conn.row_factory = sqlite3.Row
            c = conn.cursor()
            c.execute('SELECT avatar FROM users WHERE id = ?', (user_id,))
            user = c.fetchone()
            if user and user['avatar']:
                return send_file(
                    BytesIO(user['avatar']),
                    mimetype='image/jpeg'
                )
            else:
                return jsonify({
                    'status': 'error',
                    'message': get_translation('avatar_not_found')
                }), 404
    except Exception as e:
        logging.error(f"Ошибка при получении аватара: {str(e)}")
        return jsonify({
            'status': 'error',
            'message': get_translation('server_error')
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
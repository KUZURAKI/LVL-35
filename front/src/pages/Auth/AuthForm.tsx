import React, { useState, useEffect, FormEvent } from "react";
import styles from "../Auth/Auth.module.scss";
import { UserFormData, PasswordValidations } from "../../Interfaces/Interfaces";

interface AuthFormProps {
  isOpen: boolean;
  onClose: () => void;
  onRegister: (data: UserFormData, userId?: number) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ isOpen, onClose, onRegister }) => {
  const [formData, setFormData] = useState<UserFormData>({
    login: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    email: "",
    phone: "",
    about: "",
    avatar: null,
  });
  const [passwordValidations, setPasswordValidations] =
    useState<PasswordValidations>({
      length: false,
      digit: false,
      letter: false,
      special: false,
      match: false,
    });
  const [charCount, setCharCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showRequirements, setShowRequirements] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "phone") {
      let cleaned = value.replace(/[^\d+]/g, "");
      if (!cleaned.startsWith("+7")) {
        cleaned = "+7" + cleaned.replace(/^\+7/, "");
      }
      const digits = cleaned.replace("+7", "");
      let formatted = "+7";
      if (digits.length > 0) {
        formatted += " (" + digits.substring(0, 3);
      }
      if (digits.length >= 3) {
        formatted += ") " + digits.substring(3, 6);
      }
      if (digits.length >= 6) {
        formatted += "-" + digits.substring(6, 8);
      }
      if (digits.length >= 8) {
        formatted += "-" + digits.substring(8, 10);
      }
      setFormData((prev) => ({ ...prev, phone: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    if (name === "about") {
      setCharCount(value.length);
    }

    if (name === "password" || name === "confirmPassword") {
      validatePassword();
    }
  };

  const handlePhoneFocus = () => {
    if (!formData.phone) {
      setFormData((prev) => ({ ...prev, phone: "+7" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, avatar: file }));
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, avatar: file }));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validatePassword = () => {
    const { password, confirmPassword } = formData;
    const validations: PasswordValidations = {
      length: password.length >= 8,
      digit: /\d/.test(password),
      letter: /[a-zA-Zа-яА-Я]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
      match: password === confirmPassword && password !== "",
    };
    setPasswordValidations(validations);
    setShowRequirements(
      password !== "" && !Object.values(validations).every(Boolean)
    );
  };

  useEffect(() => {
    validatePassword();
  }, [formData.password, formData.confirmPassword]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

    const formDataToSend = new FormData();
    formDataToSend.append("login", formData.login);
    formDataToSend.append("password", formData.password);
    formDataToSend.append("confirm_password", formData.confirmPassword);
    formDataToSend.append("full_name", formData.fullName);
    formDataToSend.append("email", formData.email);
    formDataToSend.append("phone", formData.phone.replace(/[^\d+]/g, ""));
    formDataToSend.append("about", formData.about);
    if (formData.avatar) {
      formDataToSend.append("avatar", formData.avatar);
    }

    try {
      const response = await fetch(`${apiUrl}/api/users`, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess(true);
        onRegister(formData, data.data?.id);
        setFormData({
          login: "",
          password: "",
          confirmPassword: "",
          fullName: "",
          email: "",
          phone: "",
          about: "",
          avatar: null,
        });
        setCharCount(0);
        onClose();
      } else {
        setError(data.message || "Ошибка регистрации");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Ошибка сервера. Попробуйте снова позже.");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <button className={styles.closeButton} onClick={onClose}>
          ×
        </button>
        <section className={styles.formInfo}>
          <form className={styles.container} onSubmit={handleSubmit}>
            {success && (
              <p className={styles.success}>
                Регистрация прошла успешно! Проверьте вашу почту.
              </p>
            )}
            {error && <p className={styles.error}>{error}</p>}

            <fieldset className={formData.login ? "" : styles.invalid}>
              <legend>
                Логин <span>*</span>
              </legend>
              <input
                type="text"
                name="login"
                value={formData.login}
                onChange={handleInputChange}
                placeholder="К примеру: ivan"
                required
              />
            </fieldset>

            <fieldset
              className={passwordValidations.length ? "" : styles.invalid}
            >
              <legend>
                Пароль <span>*</span>
              </legend>
              <div className={styles.passwordField}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="К примеру: 123#Test_"
                  required
                />
                <span
                  className={styles.togglePassword}
                  onClick={togglePasswordVisibility}
                >
                  <img
                    src={showPassword ? "/eye-off.png" : "/eye.png"}
                    alt="Пароль"
                  />
                </span>
              </div>
            </fieldset>

            {showRequirements && (
              <div className={styles.passwordRequirements}>
                <p>Требования</p>
                <ul>
                  <li
                    className={
                      passwordValidations.length ? styles.valid : styles.invalid
                    }
                  >
                    <span className={styles.requirementIcon}>
                      {passwordValidations.length ? "✓" : "✖"}
                    </span>
                    Минимум 8 символов
                  </li>
                  <li
                    className={
                      passwordValidations.digit ? styles.valid : styles.invalid
                    }
                  >
                    <span className={styles.requirementIcon}>
                      {passwordValidations.digit ? "✓" : "✖"}
                    </span>
                    Содержит цифры
                  </li>
                  <li
                    className={
                      passwordValidations.letter ? styles.valid : styles.invalid
                    }
                  >
                    <span className={styles.requirementIcon}>
                      {passwordValidations.letter ? "✓" : "✖"}
                    </span>
                    Содержит буквы
                  </li>
                  <li
                    className={
                      passwordValidations.special
                        ? styles.valid
                        : styles.invalid
                    }
                  >
                    <span className={styles.requirementIcon}>
                      {passwordValidations.special ? "✓" : "✖"}
                    </span>
                    Содержит спецсимволы
                  </li>
                  <li
                    className={
                      passwordValidations.match ? styles.valid : styles.invalid
                    }
                  >
                    <span className={styles.requirementIcon}>
                      {passwordValidations.match ? "✓" : "✖"}
                    </span>
                    Пароли совпадают
                  </li>
                </ul>
              </div>
            )}

            <fieldset
              className={passwordValidations.match ? "" : styles.invalid}
            >
              <legend>
                Повторите пароль <span>*</span>
              </legend>
              <div className={styles.passwordField}>
                <input
                  type={showPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="К примеру: 123#Test_"
                  required
                />
                <span
                  className={styles.togglePassword}
                  onClick={togglePasswordVisibility}
                >
                  <img
                    src={showPassword ? "/eye-off.png" : "/eye.png"}
                    alt="Пароль"
                  />
                </span>
              </div>
            </fieldset>

            <fieldset className={formData.fullName ? "" : styles.invalid}>
              <legend>
                ФИО <span>*</span>
              </legend>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder="Иванов Иван Иванович"
                required
              />
            </fieldset>

            <fieldset className={formData.email ? "" : styles.invalid}>
              <legend>
                Почта <span>*</span>
              </legend>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="ivan@yandex.ru"
                required
              />
            </fieldset>

            <fieldset className={formData.phone ? "" : styles.invalid}>
              <legend>
                Телефон <span>*</span>
              </legend>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                onFocus={handlePhoneFocus}
                placeholder="+7 (XXX) XXX-XX-XX"
                maxLength={18}
                required
              />
            </fieldset>

            <fieldset className={formData.about ? "" : styles.invalid}>
              <legend>
                О себе <span>*</span>
              </legend>
              <textarea
                name="about"
                value={formData.about}
                onChange={handleInputChange}
                placeholder="К примеру: Я занимаюсь спортом"
                maxLength={500}
                required
              />
              <div className={styles.charCounter}>
                <span>{charCount}</span>/500
              </div>
            </fieldset>

            <fieldset className={formData.avatar ? "" : styles.invalid}>
              <legend>
                Аватар <span>*</span>
              </legend>
              <div
                className={`${styles.dropZone} ${
                  isDragging ? styles.dragover : ""
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <p>Перетащите изображение сюда или нажмите для выбора</p>
                <input
                  type="file"
                  name="avatar"
                  accept="image/jpeg,image/png,image/gif"
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                  id="avatarInput"
                />
                <label htmlFor="avatarInput">
                  <button
                    type="button"
                    onClick={() =>
                      document.getElementById("avatarInput")?.click()
                    }
                  >
                    Выбрать файл
                  </button>
                </label>
              </div>
              {formData.avatar && (
                <div className={styles.avatarPreviewContainer}>
                  <img
                    src={URL.createObjectURL(formData.avatar)}
                    alt="Avatar preview"
                    className={styles.avatarPreview}
                  />
                </div>
              )}
            </fieldset>

            <button
              type="submit"
              disabled={!Object.values(passwordValidations).every(Boolean)}
            >
              Отправить
            </button>

            <p className={styles.textInfo}>
              Текс с <span>*</span> обязательные поля
            </p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default AuthForm;

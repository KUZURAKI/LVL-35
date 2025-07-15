import React, { useState, useEffect } from "react";
import AuthForm from "../Auth/AuthForm";
import styles from "./Home.module.scss";
import { UserFormData } from "../../Interfaces/Interfaces";

interface HomeProps {
  isModalOpen: boolean;
  onCloseModal: () => void;
  onOpenModal: () => void;
}

interface ExtendedUserFormData extends UserFormData {
  id?: number;
}

const Home: React.FC<HomeProps> = ({
  isModalOpen,
  onCloseModal,
  onOpenModal,
}) => {
  const [registeredUsers, setRegisteredUsers] = useState<
    ExtendedUserFormData[]
  >(() => {
    const savedUsers = localStorage.getItem("registeredUsers");
    return savedUsers ? JSON.parse(savedUsers) : [];
  });

  useEffect(() => {
    const usersToSave = registeredUsers.map(({ avatar, ...rest }) => rest);
    localStorage.setItem("registeredUsers", JSON.stringify(usersToSave));
  }, [registeredUsers]);

  const handleRegister = (data: UserFormData, userId?: number) => {
    setRegisteredUsers((prev) => [...prev, { ...data, id: userId }]);
  };

  // const clearUsers = () => {
  //   setRegisteredUsers([]);
  //   localStorage.removeItem("registeredUsers");
  // };

  return (
    <main className={styles.main}>
      {isModalOpen ? (
        <AuthForm
          isOpen={isModalOpen}
          onClose={onCloseModal}
          onRegister={handleRegister}
        />
      ) : (
        <>
          <div className={styles.light}></div>
          <div className={styles.container}>
            {registeredUsers.length === 0 ? (
              <div className={styles.noUsersMessage}>
                <h2>Пока нет зарегистрированных пользователей</h2>
                <div className={styles.registerInfo}>
                  <p>Зарегистрируйте, чтобы начать!</p>
                  <button
                    onClick={onOpenModal}
                    className={styles.registerButton}
                  >
                    Зарегистрировать
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.userList}>
                <h2>Зарегистрированные пользователи</h2>
                {/* <button onClick={clearUsers} className={styles.clearButton}>
                  Очистить список
                </button> */}
                {registeredUsers.map((user, index) => (
                  <div key={user.id ?? index} className={styles.userInfo}>
                    <h3>Пользователь {index + 1}</h3>
                    <p>
                      <strong>Логин:</strong> {user.login}
                    </p>
                    <p>
                      <strong>ФИО:</strong> {user.fullName}
                    </p>
                    <p>
                      <strong>Email:</strong> {user.email}
                    </p>
                    <p>
                      <strong>Телефон:</strong> {user.phone}
                    </p>
                    <p>
                      <strong>О себе:</strong> {user.about}
                    </p>
                    {user.id && (
                      <div>
                        <p>
                          <strong>Аватар:</strong>
                        </p>
                        <img
                          src={`http://localhost:5000/avatar/${user.id}`}
                          alt="User avatar"
                          className={styles.userAvatar}
                          onError={(e) => {
                            if (user.avatar) {
                              e.currentTarget.src = URL.createObjectURL(
                                user.avatar
                              );
                            } else {
                              e.currentTarget.src = "/placeholder.png";
                            }
                          }}
                        />
                      </div>
                    )}
                    {!user.id && user.avatar && (
                      <div>
                        <p>
                          <strong>Аватар:</strong>
                        </p>
                        <img
                          src={URL.createObjectURL(user.avatar)}
                          alt="User avatar"
                          className={styles.userAvatar}
                        />
                      </div>
                    )}
                    {!user.id && !user.avatar && (
                      <div>
                        <p>
                          <strong>Аватар:</strong>
                        </p>
                        <img
                          src="/placeholder.png"
                          alt="User avatar"
                          className={styles.userAvatar}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </main>
  );
};

export default Home;

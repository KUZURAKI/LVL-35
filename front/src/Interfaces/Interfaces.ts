export interface UserFormData {
  login: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  email: string;
  phone: string;
  about: string;
  avatar: File | null;
}

export interface PasswordValidations {
  length: boolean;
  digit: boolean;
  letter: boolean;
  special: boolean;
  match: boolean;
}

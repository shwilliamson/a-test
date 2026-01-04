import { useState, useCallback, useId } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Validation constants
const USERNAME_MIN_LENGTH = 6;
const USERNAME_MAX_LENGTH = 12;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 16;

// API URL from environment
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

interface FormErrors {
  username?: string;
  password?: string;
  general?: string;
}

interface FormTouched {
  username: boolean;
  password: boolean;
}

function LoginPage() {
  const navigate = useNavigate();
  const usernameId = useId();
  const passwordId = useId();
  const rememberMeId = useId();
  const usernameErrorId = useId();
  const passwordErrorId = useId();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<FormTouched>({
    username: false,
    password: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation functions
  const validateUsername = useCallback((value: string): string | undefined => {
    const trimmed = value.trim();
    if (trimmed.length < USERNAME_MIN_LENGTH) {
      return `Username must be at least ${USERNAME_MIN_LENGTH} characters`;
    }
    if (trimmed.length > USERNAME_MAX_LENGTH) {
      return `Username must be at most ${USERNAME_MAX_LENGTH} characters`;
    }
    return undefined;
  }, []);

  const validatePassword = useCallback((value: string): string | undefined => {
    if (value.length < PASSWORD_MIN_LENGTH) {
      return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
    }
    if (value.length > PASSWORD_MAX_LENGTH) {
      return `Password must be at most ${PASSWORD_MAX_LENGTH} characters`;
    }
    return undefined;
  }, []);

  // Handle blur events for validation
  const handleUsernameBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, username: true }));
    const error = validateUsername(username);
    setErrors((prev) => ({ ...prev, username: error }));
  }, [username, validateUsername]);

  const handlePasswordBlur = useCallback(() => {
    setTouched((prev) => ({ ...prev, password: true }));
    const error = validatePassword(password);
    setErrors((prev) => ({ ...prev, password: error }));
  }, [password, validatePassword]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const usernameError = validateUsername(username);
    const passwordError = validatePassword(password);

    setTouched({ username: true, password: true });
    setErrors({
      username: usernameError,
      password: passwordError,
    });

    // Focus first invalid field
    if (usernameError) {
      document.getElementById(usernameId)?.focus();
      return;
    }
    if (passwordError) {
      document.getElementById(passwordId)?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === "INVALID_CREDENTIALS") {
          setErrors({ general: "Invalid username or password" });
        } else if (data.error === "RATE_LIMIT_EXCEEDED") {
          setErrors({ general: "Too many login attempts. Please try again later." });
        } else {
          setErrors({ general: "Something went wrong. Please try again." });
        }
        return;
      }

      // Success - redirect to lists page
      navigate("/lists");
    } catch {
      setErrors({ general: "Something went wrong. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
          <CardDescription>
            Welcome back! Sign in to access your lists
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* General error */}
            {errors.general && (
              <div
                role="alert"
                className="text-sm text-destructive bg-destructive/10 p-3 rounded-md"
              >
                {errors.general}
              </div>
            )}

            {/* Username field */}
            <div className="space-y-2">
              <Label htmlFor={usernameId}>Username</Label>
              <Input
                id={usernameId}
                type="text"
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={handleUsernameBlur}
                disabled={isSubmitting}
                aria-invalid={touched.username && !!errors.username}
                aria-describedby={
                  touched.username && errors.username
                    ? usernameErrorId
                    : undefined
                }
                maxLength={USERNAME_MAX_LENGTH}
              />
              <div className="flex justify-between items-center min-h-[1.25rem]">
                {touched.username && errors.username ? (
                  <span
                    id={usernameErrorId}
                    className="text-sm text-destructive"
                  >
                    {errors.username}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className={`text-xs ${
                    username.trim().length >= USERNAME_MAX_LENGTH
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {username.trim().length}/{USERNAME_MAX_LENGTH}
                </span>
              </div>
            </div>

            {/* Password field */}
            <div className="space-y-2">
              <Label htmlFor={passwordId}>Password</Label>
              <Input
                id={passwordId}
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={handlePasswordBlur}
                disabled={isSubmitting}
                aria-invalid={touched.password && !!errors.password}
                aria-describedby={
                  touched.password && errors.password
                    ? passwordErrorId
                    : undefined
                }
                maxLength={PASSWORD_MAX_LENGTH}
              />
              <div className="flex justify-between items-center min-h-[1.25rem]">
                {touched.password && errors.password ? (
                  <span
                    id={passwordErrorId}
                    className="text-sm text-destructive"
                  >
                    {errors.password}
                  </span>
                ) : (
                  <span />
                )}
                <span
                  className={`text-xs ${
                    password.length >= PASSWORD_MAX_LENGTH
                      ? "text-destructive"
                      : "text-muted-foreground"
                  }`}
                >
                  {password.length}/{PASSWORD_MAX_LENGTH}
                </span>
              </div>
            </div>

            {/* Remember me checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id={rememberMeId}
                checked={rememberMe}
                onCheckedChange={setRememberMe}
                disabled={isSubmitting}
              />
              <Label
                htmlFor={rememberMeId}
                className="text-sm font-normal cursor-pointer"
              >
                Remember me
              </Label>
            </div>

            {/* Submit button */}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>

            {/* Link to registration */}
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-primary underline-offset-4 hover:underline"
              >
                Create one
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginPage;

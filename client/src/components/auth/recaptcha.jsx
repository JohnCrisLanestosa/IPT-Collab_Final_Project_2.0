import ReCAPTCHA from "react-google-recaptcha";
import { useRef } from "react";

function RecaptchaComponent({ onVerify }) {
  const recaptchaRef = useRef(null);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  const handleRecaptchaChange = (token) => {
    // Pass the token to parent component
    if (onVerify) {
      onVerify(token);
    }
  };

  const handleRecaptchaExpired = () => {
    // Token expired, notify parent to clear token
    if (onVerify) {
      onVerify(null);
    }
  };

  const handleRecaptchaError = () => {
    // Error occurred, notify parent
    if (onVerify) {
      onVerify(null);
    }
  };

  return (
    <div className="flex justify-center my-4">
      <ReCAPTCHA
        ref={recaptchaRef}
        sitekey={siteKey}
        onChange={handleRecaptchaChange}
        onExpired={handleRecaptchaExpired}
        onErrored={handleRecaptchaError}
        theme="light"
      />
    </div>
  );
}

export default RecaptchaComponent;


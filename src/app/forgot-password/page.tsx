import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import ForgotPasswordForm from "@/components/ui/ForgotPasswordForm";

function ForgotPasswordPage() {
  return (
    <div className="mt-20 flex flex-1 flex-col items-center">
      <center>
        <Card className="w-full max-w-md">
          <CardHeader className="mb-4">
            <CardTitle className="text-center text-3xl">
              Forgot Password
            </CardTitle>
          </CardHeader>
          <ForgotPasswordForm />
        </Card>
      </center>
    </div>
  );
}

export default ForgotPasswordPage;


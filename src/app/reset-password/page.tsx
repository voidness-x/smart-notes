import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import ResetPasswordForm from "@/components/ui/ResetPasswordForm";

function ResetPasswordPage() {
  return (
    <div className="mt-20 flex flex-1 flex-col items-center">
      <center>
        <Card className="w-full max-w-md">
          <CardHeader className="mb-4">
            <CardTitle className="text-center text-3xl">
              Reset Password
            </CardTitle>
          </CardHeader>
          <ResetPasswordForm />
        </Card>
      </center>
    </div>
  );
}

export default ResetPasswordPage;


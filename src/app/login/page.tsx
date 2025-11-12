import AuthForm from "@/components/ui/AuthForm";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

function LoginPage() {
  return (
    <div className="mt-20 felx flex-1 flex-col items-center">
        <center>
        <Card className="w-full max-w-md">
            <CardHeader className="mb-4">
                <CardTitle className="text-center text-3xl">
                    Login
                </CardTitle>
            </CardHeader>

            <AuthForm type="login" />
        </Card>
        </center>
    </div>
  )
}

export default LoginPage
import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { UserLoginForm } from "@/components/user-login-form"

export default function UserLoginPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <MSEHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <UserLoginForm />
      </div>
      <MSEFooter />
    </main>
  )
}

import { MSEHeader } from "@/components/mse-header"
import { MSEFooter } from "@/components/mse-footer"
import { UserRegisterForm } from "@/components/user-register-form"

export default function UserRegisterPage() {
  return (
    <main className="min-h-screen flex flex-col bg-white">
      <MSEHeader />
      <div className="flex-1 flex items-center justify-center p-4">
        <UserRegisterForm />
      </div>
      <MSEFooter />
    </main>
  )
}

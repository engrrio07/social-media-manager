// src/app/(auth)/layout.tsx
export default function AuthLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md space-y-8 p-6">
          {children}
        </div>
      </div>
    )
  }
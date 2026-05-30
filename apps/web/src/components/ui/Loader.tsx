import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: number
}

export function Loader({ className, size = 24, ...props }: LoaderProps) {
    return (
        <div className={cn("flex items-center justify-center", className)} {...props}>
            <Loader2 className="animate-spin text-primary" size={size} />
        </div>
    )
}

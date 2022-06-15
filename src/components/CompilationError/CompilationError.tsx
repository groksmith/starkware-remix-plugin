import React, {ReactElement} from "react";
import './CompilationError.css'

interface ErrorBlobProps{
    message: string
}
const Error: React.FC<ErrorBlobProps> = (props:ErrorBlobProps): ReactElement => {
    const {message } = props

    return (
    <div className="cairoErrorBlob">
        <div className="cairoError alertDanger">
          <pre>
            <span className="errorContent">{message}</span>
          </pre>
        </div>
    </div>
)
}

export default Error;
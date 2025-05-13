
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Copy the uploaded image to the public folder
const uploadedImage = '/lovable-uploads/4340a3e3-840a-4d22-8e65-363697f91265.png';

createRoot(document.getElementById("root")!).render(<App />);

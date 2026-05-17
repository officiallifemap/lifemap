import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            'AIzaSyBPNqPCbRM86E1-vj4yRi6oHVUO8Xvhe18',
  authDomain:        'lifemap-46fc4.firebaseapp.com',
  projectId:         'lifemap-46fc4',
  storageBucket:     'lifemap-46fc4.firebasestorage.app',
  messagingSenderId: '527946648217',
  appId:             '1:527946648217:web:15f06b92a4925a62fdc608',
}

const app = initializeApp(firebaseConfig)

export const auth           = getAuth(app)
export const db             = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()

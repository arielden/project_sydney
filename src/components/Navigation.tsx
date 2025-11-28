import { Link } from 'react-router-dom';

export default function Navigation() {
  return (
    <nav className="bg-gray-100 p-4">
      <div className="flex space-x-4">
        <Link to="/" className="text-blue-600 hover:text-blue-800">
          Home
        </Link>
        <Link to="/login" className="text-blue-600 hover:text-blue-800">
          Login
        </Link>
        <Link to="/register" className="text-blue-600 hover:text-blue-800">
          Register
        </Link>
        <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
          Dashboard
        </Link>
        <Link to="/quiz" className="text-blue-600 hover:text-blue-800">
          Quiz
        </Link>
      </div>
    </nav>
  );
}
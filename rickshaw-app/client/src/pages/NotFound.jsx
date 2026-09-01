import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
      <p className="text-xl text-gray-600 mb-6">Page not found</p>
      <Link
        to="/login"
        className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-green-700 transition"
      >
        Go Home
      </Link>
    </div>
  );
};

export default NotFound;

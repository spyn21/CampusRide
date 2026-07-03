import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Bus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Register() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') || 'passenger';

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    role: defaultRole,
    vehicleType: 'E-Rickshaw',
    vehicleNumber: '',
    vehicleColor: '',
    licenseNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const payload = {
      name: form.name,
      email: form.email,
      password: form.password,
      phone: form.phone,
      role: form.role,
    };

    if (form.role === 'driver') {
      payload.vehicleInfo = {
        type: form.vehicleType,
        number: form.vehicleNumber,
        color: form.vehicleColor,
      };
      payload.verificationInfo = { licenseNumber: form.licenseNumber };
    }

    try {
      const user = await register(payload);
      navigate(user.role === 'driver' ? '/driver' : '/passenger');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="bg-primary-600 w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Bus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Create Account</h1>
          <p className="text-gray-500 mt-1">Join the CampusRide community</p>
        </div>

        <div className="card">
          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <div className="flex gap-2 mb-6">
            {['passenger', 'driver'].map((role) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm({ ...form, role })}
                className={`flex-1 py-2 rounded-lg font-medium capitalize transition-colors ${
                  form.role === role
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {role}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input name="name" className="input-field" value={form.name} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Email</label>
              <input name="email" type="email" className="input-field" value={form.email} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Phone</label>
              <input name="phone" className="input-field" value={form.phone} onChange={handleChange} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" className="input-field" value={form.password} onChange={handleChange} minLength={6} required />
            </div>

            {form.role === 'driver' && (
              <>
                <hr className="my-4" />
                <h3 className="font-medium text-gray-700">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Vehicle Type</label>
                    <input name="vehicleType" className="input-field" value={form.vehicleType} onChange={handleChange} required />
                  </div>
                  <div>
                    <label className="label">Color</label>
                    <input name="vehicleColor" className="input-field" value={form.vehicleColor} onChange={handleChange} required />
                  </div>
                </div>
                <div>
                  <label className="label">Vehicle Number</label>
                  <input name="vehicleNumber" className="input-field" value={form.vehicleNumber} onChange={handleChange} placeholder="UK-07-AB-1234" required />
                </div>
                <div>
                  <label className="label">License Number</label>
                  <input name="licenseNumber" className="input-field" value={form.licenseNumber} onChange={handleChange} required />
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  );
}

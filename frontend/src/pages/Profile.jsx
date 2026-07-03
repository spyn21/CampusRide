import { useState } from 'react';
import { User, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    vehicleType: user?.vehicleInfo?.type || '',
    vehicleNumber: user?.vehicleInfo?.number || '',
    vehicleColor: user?.vehicleInfo?.color || '',
    licenseNumber: user?.verificationInfo?.licenseNumber || '',
  });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const updates = { name: form.name, phone: form.phone };
      if (user.role === 'driver') {
        updates.vehicleInfo = {
          type: form.vehicleType,
          number: form.vehicleNumber,
          color: form.vehicleColor,
        };
        updates.verificationInfo = { licenseNumber: form.licenseNumber };
      }
      await updateProfile(updates);
      setMessage('Profile updated successfully!');
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-8">
          <div className="bg-primary-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold">{user?.name}</h1>
          <p className="text-gray-500 capitalize">{user?.role} • {user?.email}</p>
        </div>

        <div className="card">
          {message && (
            <div className={`px-4 py-3 rounded-lg mb-4 text-sm ${
              message.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Full Name</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="label">Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>

            {user?.role === 'driver' && (
              <>
                <hr />
                <h3 className="font-medium">Vehicle Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Type</label>
                    <input className="input-field" value={form.vehicleType} onChange={(e) => setForm({ ...form, vehicleType: e.target.value })} />
                  </div>
                  <div>
                    <label className="label">Color</label>
                    <input className="input-field" value={form.vehicleColor} onChange={(e) => setForm({ ...form, vehicleColor: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label className="label">Vehicle Number</label>
                  <input className="input-field" value={form.vehicleNumber} onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })} />
                </div>
                <div>
                  <label className="label">License Number</label>
                  <input className="input-field" value={form.licenseNumber} onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })} />
                </div>
              </>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

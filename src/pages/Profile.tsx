import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { authService } from '../services/authService';
import { User, Mail, Calendar } from 'lucide-react';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    age: user?.age?.toString() || '',
    gender: user?.gender || '',
    address: user?.address || '',
    city: user?.city || '',
    state: user?.state || '',
    country: user?.country || '',
    zip_code: user?.zip_code || '',
    phone: user?.phone || '',
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    const parsed = new Date(dateString);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-light to-white pt-24 pb-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-xl shadow-card p-8 border border-sky-blue-light">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-navy-dark to-navy-medium rounded-full flex items-center justify-center">
              <User size={34} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-navy-dark">
                {user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.username}
              </h1>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-gray-600">
                <span className="flex items-center gap-1 text-sm">
                  <Mail size={16} />
                  {user.email}
                </span>
                <span className="flex items-center gap-1 text-sm">
                  <Calendar size={16} />
                  Joined {formatDate(user.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-8 border border-sky-blue-light">
          <div className="flex flex-row items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-navy-dark">Profile Details</h2>
            {!editMode && (
              <button
                className="px-4 py-2 rounded bg-gradient-to-r from-navy-dark to-navy-medium text-white font-semibold hover:from-navy-medium hover:to-sky-blue transition shadow-sm hover:shadow-card"
                onClick={() => setEditMode(true)}
              >
                Edit
              </button>
            )}
          </div>
          {editMode ? (
            <form
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
              onSubmit={async (e) => {
                e.preventDefault();
                setSaving(true);
                setSaveError(null);
                try {
                  const payload = {
                    ...form,
                    age: form.age ? parseInt(form.age) : undefined,
                  };
                  const updatedUser = await authService.updateProfile(payload);
                  setUser && setUser(updatedUser);
                  setEditMode(false);
                } catch (err: any) {
                  setSaveError(err?.message || 'Failed to save profile.');
                } finally {
                  setSaving(false);
                }
              }}
            >
              <div>
                <label className="text-sm font-medium text-navy-dark">First Name</label>
                <input
                  className="mt-1 w-full border border-sky-blue-light rounded px-3 py-2 focus:ring-2 focus:ring-navy-dark focus:border-transparent bg-sky-blue-light bg-opacity-30"
                  value={form.first_name}
                  onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-dark">Last Name</label>
                <input
                  className="mt-1 w-full border border-sky-blue-light rounded px-3 py-2 focus:ring-2 focus:ring-navy-dark focus:border-transparent bg-sky-blue-light bg-opacity-30"
                  value={form.last_name}
                  onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                  autoComplete="family-name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-dark">Age</label>
                <input
                  className="mt-1 w-full border border-sky-blue-light rounded px-3 py-2 focus:ring-2 focus:ring-navy-dark focus:border-transparent bg-sky-blue-light bg-opacity-30"
                  type="number"
                  min="0"
                  value={form.age}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-dark">Gender</label>
                <select
                  className="mt-1 w-full border border-sky-blue-light rounded px-3 py-2 focus:ring-2 focus:ring-navy-dark focus:border-transparent bg-sky-blue-light bg-opacity-30"
                  value={form.gender}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}
                >
                  <option value="">Select...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                  <option value="prefer_not_to_say">Prefer not to say</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-navy-dark">Address</label>
                <input
                  className="mt-1 w-full border border-sky-blue-light rounded px-3 py-2 focus:ring-2 focus:ring-navy-dark focus:border-transparent bg-sky-blue-light bg-opacity-30"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  autoComplete="street-address"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-dark">City</label>
                <input
                  className="mt-1 w-full border border-sky-blue-light rounded px-3 py-2 focus:ring-2 focus:ring-navy-dark focus:border-transparent bg-sky-blue-light bg-opacity-30"
                  value={form.city}
                  onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                  autoComplete="address-level2"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-dark">State</label>
                <input
                  className="mt-1 w-full border border-sky-blue-light rounded px-3 py-2 focus:ring-2 focus:ring-navy-dark focus:border-transparent bg-sky-blue-light bg-opacity-30"
                  value={form.state}
                  onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                  autoComplete="address-level1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-dark">Country</label>
                <input
                  className="mt-1 w-full border border-sky-blue-light rounded px-3 py-2 focus:ring-2 focus:ring-navy-dark focus:border-transparent bg-sky-blue-light bg-opacity-30"
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                  autoComplete="country"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-navy-dark">ZIP/Postal Code</label>
                <input
                  className="mt-1 w-full border border-sky-blue-light rounded px-3 py-2 focus:ring-2 focus:ring-navy-dark focus:border-transparent bg-sky-blue-light bg-opacity-30"
                  value={form.zip_code}
                  onChange={e => setForm(f => ({ ...f, zip_code: e.target.value }))}
                  autoComplete="postal-code"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-navy-dark">Phone</label>
                <input
                  className="mt-1 w-full border border-sky-blue-light rounded px-3 py-2 focus:ring-2 focus:ring-navy-dark focus:border-transparent bg-sky-blue-light bg-opacity-30"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  autoComplete="tel"
                />
              </div>
              <div className="md:col-span-2 flex gap-3 mt-4">
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-gradient-to-r from-navy-dark to-navy-medium text-white font-semibold hover:from-navy-medium hover:to-sky-blue transition disabled:opacity-60 shadow-sm"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  type="button"
                  className="px-4 py-2 rounded bg-gray-light text-navy-dark font-semibold hover:bg-gray-200 transition"
                  onClick={() => {
                    setEditMode(false);
                    setForm({
                      first_name: user.first_name || '',
                      last_name: user.last_name || '',
                      age: user.age?.toString() || '',
                      gender: user.gender || '',
                      address: user.address || '',
                      city: user.city || '',
                      state: user.state || '',
                      country: user.country || '',
                      zip_code: user.zip_code || '',
                      phone: user.phone || '',
                    });
                  }}
                  disabled={saving}
                >
                  Cancel
                </button>
              </div>
              {saveError && (
                <div className="md:col-span-2 text-red-error text-sm mt-2 font-medium">{saveError}</div>
              )}
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-navy-dark">Username</p>
                <p className="text-gray-900">{user.username}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-navy-dark">Email Address</p>
                <p className="text-gray-900">{user.email}</p>
              </div>
              {user.first_name && (
                <div>
                  <p className="text-sm font-medium text-navy-dark">First Name</p>
                  <p className="text-gray-900">{user.first_name}</p>
                </div>
              )}
              {user.last_name && (
                <div>
                  <p className="text-sm font-medium text-navy-dark">Last Name</p>
                  <p className="text-gray-900">{user.last_name}</p>
                </div>
              )}
              {user.age && (
                <div>
                  <p className="text-sm font-medium text-navy-dark">Age</p>
                  <p className="text-gray-900">{user.age}</p>
                </div>
              )}
              {user.gender && (
                <div>
                  <p className="text-sm font-medium text-navy-dark">Gender</p>
                  <p className="text-gray-900">{user.gender}</p>
                </div>
              )}
              {user.address && (
                <div>
                  <p className="text-sm font-medium text-navy-dark">Address</p>
                  <p className="text-gray-900">{user.address}</p>
                </div>
              )}
              {user.city && (
                <div>
                  <p className="text-sm font-medium text-navy-dark">City</p>
                  <p className="text-gray-900">{user.city}</p>
                </div>
              )}
              {user.state && (
                <div>
                  <p className="text-sm font-medium text-navy-dark">State</p>
                  <p className="text-gray-900">{user.state}</p>
                </div>
              )}
              {user.country && (
                <div>
                  <p className="text-sm font-medium text-navy-dark">Country</p>
                  <p className="text-gray-900">{user.country}</p>
                </div>
              )}
              {user.zip_code && (
                <div>
                  <p className="text-sm font-medium text-navy-dark">ZIP/Postal Code</p>
                  <p className="text-gray-900">{user.zip_code}</p>
                </div>
              )}
              {user.phone && (
                <div>
                  <p className="text-sm font-medium text-navy-dark">Phone</p>
                  <p className="text-gray-900">{user.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-navy-dark">Account Created</p>
                <p className="text-gray-900">{formatDate(user.created_at)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-navy-dark">Account Status</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-success bg-opacity-20 text-green-success">
                  Active
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
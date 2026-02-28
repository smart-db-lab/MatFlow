import React, { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setShowProfile } from '../Slices/SideBarSlice';
import { commonApi } from '../services/api/apiService';
import { toast } from 'react-toastify';

function ProfileView({ standalone = false }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editField, setEditField] = useState(null); // 'name' | 'username' | null
  const [fieldInput, setFieldInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleBack = () => {
    if (standalone) navigate(-1);
    else dispatch(setShowProfile(false));
  };

  useEffect(() => {
    (async () => {
      try {
        const data = await commonApi.auth.getCurrentUser();
        const user = data?.user || data;
        setUserData(user || null);
        setImagePreview(user?.profile_image_url || null);
      } catch (e) {
        console.error('Failed to load profile:', e);
        setUserData(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const startEdit = (field) => {
    setEditField(field);
    setFieldInput(field === 'name' ? (userData.full_name || '') : (userData.username || ''));
  };

  const cancelEdit = () => { setEditField(null); setFieldInput(''); };

  const saveEdit = async () => {
    if (!fieldInput.trim()) return;
    try {
      setSaving(true);
      const payload = editField === 'name'
        ? { full_name: fieldInput.trim() }
        : { username: fieldInput.trim() };
      const data = await commonApi.auth.updateCurrentUser(payload);
      const u = data?.user || data;
      if (u) {
        setUserData(u);
        toast.success(editField === 'name' ? 'Name updated' : 'Username updated');
        window.dispatchEvent(new Event('profileUpdated'));
      }
      setEditField(null);
    } catch (e) {
      console.error('Failed to update:', e);
      toast.error('Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Select a valid image'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    setSelectedImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!selectedImageFile) return;
    try {
      setUploadingImage(true);
      const fd = new FormData();
      fd.append('profile_image', selectedImageFile);
      const data = await commonApi.auth.updateCurrentUser(fd);
      const u = data?.user || data;
      if (u) {
        setUserData(u);
        if (u.profile_image_url) setImagePreview(u.profile_image_url);
        setSelectedImageFile(null);
        toast.success('Photo updated');
        window.dispatchEvent(new Event('profileUpdated'));
      }
    } catch (e) {
      console.error('Failed to upload:', e);
      toast.error('Failed to upload image');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const getInitials = () => {
    if (!userData) return 'U';
    const n = userData.full_name;
    if (n) {
      const parts = n.trim().split(' ');
      return parts.length >= 2
        ? `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
        : n.charAt(0).toUpperCase();
    }
    return (userData.email || 'U').charAt(0).toUpperCase();
  };

  const outer = standalone
    ? 'mt-16 min-h-[calc(100vh-4rem)] bg-gray-50'
    : 'w-full h-full bg-gray-50 overflow-y-auto';

  if (loading) {
    return (
      <div className={`${outer} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className={`${outer} flex items-center justify-center`}>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center max-w-xs">
          <p className="text-gray-500 mb-4">Could not load profile</p>
          <button onClick={() => navigate(-1)} className="text-sm font-medium text-primary hover:underline">Go back</button>
        </div>
      </div>
    );
  }

  const displayName = userData.full_name || userData.username || userData.email?.split('@')[0] || 'User';
  const accountType = userData.is_superuser ? 'Super Admin' : userData.is_staff ? 'Staff' : 'Member';
  const badgeCls = userData.is_superuser
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
    : userData.is_staff
    ? 'bg-teal-50 text-teal-700 ring-teal-200'
    : 'bg-gray-100 text-gray-600 ring-gray-200';

  const joinedStr = userData.date_joined
    ? new Date(userData.date_joined).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : null;

  const joinedFull = userData.date_joined
    ? new Date(userData.date_joined).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  const lastLogin = userData.last_login
    ? new Date(userData.last_login).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className={outer}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button onClick={handleBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-primary transition-colors mb-6">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {standalone ? 'Back' : 'Back to Project'}
        </button>

        {/* Profile hero card */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mb-6">
          <div className="h-32 bg-gradient-to-br from-primary/80 via-primary to-teal-600 relative">
            <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          </div>
          <div className="px-6 sm:px-8 pb-6">
            <div className="flex flex-col sm:flex-row gap-5 -mt-14 sm:-mt-12">
              {/* Avatar */}
              <div className="relative shrink-0 self-start">
                {imagePreview || userData.profile_image_url ? (
                  <img src={imagePreview || userData.profile_image_url} alt="" className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-4 border-white shadow-lg bg-white" />
                ) : (
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-primary to-teal-600 border-4 border-white shadow-lg flex items-center justify-center text-white text-3xl font-bold select-none">
                    {getInitials()}
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-lg shadow border border-gray-200 flex items-center justify-center text-gray-500 hover:text-primary transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </div>

              {/* Info beside avatar */}
              <div className="flex-1 min-w-0 pt-2 sm:pt-16">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{displayName}</h1>
                  <span className={`inline-flex items-center px-2.5 py-0.5 text-[11px] font-semibold rounded-md ring-1 ring-inset ${badgeCls}`}>{accountType}</span>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{userData.email}</p>
                {joinedStr && <p className="text-xs text-gray-400 mt-1">Member since {joinedStr}</p>}

                {selectedImageFile && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={handleImageUpload} disabled={uploadingImage} className="px-3 py-1.5 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors">
                      {uploadingImage ? 'Uploading...' : 'Save Photo'}
                    </button>
                    <button onClick={() => { setSelectedImageFile(null); setImagePreview(userData.profile_image_url || null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="px-3 py-1.5 text-xs font-medium text-gray-600 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* Left — Profile details */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="text-base font-bold text-gray-900 mb-5">Personal Information</h2>

              <div className="space-y-5">
                {/* Display Name */}
                <EditableRow
                  label="Display Name"
                  value={userData.full_name}
                  placeholder="Add your name"
                  isEditing={editField === 'name'}
                  input={fieldInput}
                  saving={saving}
                  onEdit={() => startEdit('name')}
                  onChange={setFieldInput}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />}
                />

                {/* Username */}
                <EditableRow
                  label="Username"
                  value={userData.username}
                  placeholder="Set a username"
                  isEditing={editField === 'username'}
                  input={fieldInput}
                  saving={saving}
                  onEdit={() => startEdit('username')}
                  onChange={setFieldInput}
                  onSave={saveEdit}
                  onCancel={cancelEdit}
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />}
                />

                {/* Email */}
                <InfoRow
                  label="Email Address"
                  value={userData.email}
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
                />

                {/* Phone */}
                {userData.phone_number && (
                  <InfoRow
                    label="Phone"
                    value={userData.phone_number}
                    icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Right — Account sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status card */}
            <div className="bg-gradient-to-br from-primary to-teal-600 rounded-2xl p-5 text-white">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-white/80">Account Status</p>
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full ${userData.is_active ? 'bg-white/20 text-white' : 'bg-red-400/30 text-red-100'}`}>
                  {userData.is_active ? 'ACTIVE' : 'INACTIVE'}
                </span>
              </div>
              <div>
                <p className="text-2xl font-bold">#{userData.id || '—'}</p>
                <p className="text-xs text-white/70 mt-0.5">User ID</p>
              </div>
            </div>

            {/* Account details */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Account Details</h3>
              <div className="space-y-4">
                {joinedFull && <DetailItem label="Member Since" value={joinedFull} />}
                {lastLogin && <DetailItem label="Last Login" value={lastLogin} />}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function EditableRow({ label, value, placeholder, isEditing, input, saving, onEdit, onChange, onSave, onCancel, icon }) {
  return (
    <div className="flex items-start gap-3 p-3 -mx-3 rounded-xl hover:bg-gray-50/80 transition-colors group">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <svg className="w-4.5 h-4.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        {isEditing ? (
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="w-full max-w-xs px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') onCancel(); }}
            />
            <div className="flex gap-2">
              <button onClick={onSave} disabled={saving || !input.trim()} className="px-3 py-1 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 transition-colors">
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={onCancel} className="px-3 py-1 text-xs font-medium text-gray-600 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className={`text-sm ${value ? 'text-gray-900 font-medium' : 'text-gray-400 italic'}`}>
              {value || placeholder}
            </p>
            <button onClick={onEdit} className="px-2.5 py-1 text-xs font-medium text-gray-500 rounded-md hover:text-primary hover:bg-primary/5 opacity-0 group-hover:opacity-100 transition-all">
              Edit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <div className="flex items-start gap-3 p-3 -mx-3 rounded-xl">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
        <svg className="w-4.5 h-4.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icon}</svg>
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-sm text-gray-900 font-medium break-all">{value || 'Not provided'}</p>
      </div>
    </div>
  );
}

function DetailItem({ label, value, badge, badgeClass, valueClass }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-500">{label}</span>
      {badge ? (
        <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-md ring-1 ring-inset ${badgeClass}`}>{badge}</span>
      ) : (
        <span className={`text-sm font-medium ${valueClass || 'text-gray-900'}`}>{value}</span>
      )}
    </div>
  );
}

export default ProfileView;

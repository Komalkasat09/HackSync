"use client";

import { useState, useEffect } from "react";
import { User, Mail, Calendar, Shield, Edit2, Save, X, Briefcase } from "lucide-react";
import { API_ENDPOINTS } from "@/lib/config";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: "",
    email: "",
    userType: "",
    joinedDate: "",
  });
  const [editedInfo, setEditedInfo] = useState(userInfo);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch user profile data
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const res = await fetch(API_ENDPOINTS.AUTH.ME, {
          headers: { 
            "Authorization": `Bearer ${token}` 
          },
        });
        
        if (res.ok) {
          const data = await res.json();
          setUserInfo({
            name: data.full_name,
            email: data.email,
            userType: data.user_type || "Student",
            joinedDate: new Date().toLocaleDateString(),
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = () => {
    setEditedInfo(userInfo);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedInfo(userInfo);
    setIsEditing(false);
  };

  const handleSave = () => {
    // TODO: Implement API call to update profile
    setUserInfo(editedInfo);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-foreground/60 mt-1">Manage your account information</p>
        </div>
        {!isEditing ? (
          <button
            onClick={handleEdit}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md"
          >
            <Edit2 className="w-4 h-4" />
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-foreground/10 text-foreground rounded-lg hover:bg-foreground/20 transition-all duration-300"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 shadow-md"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-card border border-border rounded-xl p-8 space-y-6">
        {/* Avatar Section */}
        <div className="flex items-center gap-6 pb-6 border-b border-border">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-lg">
            <User className="w-12 h-12 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">{userInfo.name}</h2>
            <p className="text-foreground/60 mt-1">{userInfo.email}</p>
            <span className="inline-block mt-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium">
              {userInfo.userType}
            </span>
          </div>
        </div>

        {/* Profile Information */}
        <div className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/70">
              <User className="w-4 h-4" />
              Full Name
            </label>
            {isEditing ? (
              <input
                type="text"
                value={editedInfo.name}
                onChange={(e) => setEditedInfo({ ...editedInfo, name: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground"
              />
            ) : (
              <p className="px-4 py-3 bg-background border border-border rounded-lg text-foreground">
                {userInfo.name}
              </p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/70">
              <Mail className="w-4 h-4" />
              Email Address
            </label>
            {isEditing ? (
              <input
                type="email"
                value={editedInfo.email}
                onChange={(e) => setEditedInfo({ ...editedInfo, email: e.target.value })}
                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-foreground"
              />
            ) : (
              <p className="px-4 py-3 bg-background border border-border rounded-lg text-foreground">
                {userInfo.email}
              </p>
            )}
          </div>

          {/* User Type Field */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/70">
              <Briefcase className="w-4 h-4" />
              Who Are You?
            </label>
            {isEditing ? (
              <div className="relative">
                <select
                  value={editedInfo.userType}
                  onChange={(e) => setEditedInfo({ ...editedInfo, userType: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-blue-500/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-foreground appearance-none cursor-pointer hover:border-blue-500/50 transition-all duration-200 pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                    backgroundPosition: 'right 0.5rem center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '1.5em 1.5em',
                  }}
                >
                  <option value="Student" className="bg-background text-foreground py-2">Student</option>
                  <option value="Developer" className="bg-background text-foreground py-2">Developer</option>
                  <option value="Freelancer" className="bg-background text-foreground py-2">Freelancer</option>
                  <option value="Professional" className="bg-background text-foreground py-2">Professional</option>
                  <option value="Career Changer" className="bg-background text-foreground py-2">Career Changer</option>
                  <option value="Entrepreneur" className="bg-background text-foreground py-2">Entrepreneur</option>
                  <option value="Job Seeker" className="bg-background text-foreground py-2">Job Seeker</option>
                  <option value="Other" className="bg-background text-foreground py-2">Other</option>
                </select>
              </div>
            ) : (
              <p className="px-4 py-3 bg-background border border-border rounded-lg text-foreground">
                {userInfo.userType}
              </p>
            )}
          </div>

          {/* Joined Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/70">
              <Calendar className="w-4 h-4" />
              Member Since
            </label>
            <p className="px-4 py-3 bg-background border border-border rounded-lg text-foreground/60">
              {userInfo.joinedDate}
            </p>
          </div>

          {/* Account Status */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground/70">
              <Shield className="w-4 h-4" />
              Account Status
            </label>
            <div className="px-4 py-3 bg-background border border-border rounded-lg">
              <span className="inline-flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Active
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Settings Card */}
      <div className="bg-card border border-border rounded-xl p-8">
        <h3 className="text-lg font-semibold text-foreground mb-4">Security</h3>
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between px-4 py-3 bg-background border border-blue-500/20 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 text-left group">
            <span className="text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">Change Password</span>
            <Edit2 className="w-4 h-4 text-blue-500" />
          </button>
          <button className="w-full flex items-center justify-between px-4 py-3 bg-background border border-blue-500/20 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-300 text-left group">
            <span className="text-foreground group-hover:text-blue-600 dark:group-hover:text-blue-400">Two-Factor Authentication</span>
            <Edit2 className="w-4 h-4 text-blue-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

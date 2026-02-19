import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronDown, 
  Check, 
  PlusCircle, 
  Users
} from 'lucide-react';

interface Profile {
  id: string;
  name: string;
  stokvelName: string;
  stokvelId: string;
  role: 'member' | 'admin';
  targetAmount: number;
  savedAmount: number;
  progress: number;
  avatar?: string;
}

interface ProfileSwitcherProps {
  profiles: Profile[];
  activeProfile: Profile;
  onSwitch: (profile: Profile) => void;
  onAddProfile?: () => void;
}

export default function ProfileSwitcher({ 
  profiles, 
  activeProfile, 
  onSwitch,
  onAddProfile 
}: ProfileSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="relative">
      {/* Profile Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors min-w-[200px]"
      >
        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-medium text-primary-700">
            {getInitials(activeProfile.name)}
          </span>
        </div>
        <div className="flex-1 text-left">
          <p className="text-sm font-medium text-gray-800 truncate">{activeProfile.name}</p>
          <p className="text-xs text-gray-500 truncate">{activeProfile.stokvelName}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-20 py-2 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500">SWITCH PROFILE</p>
            </div>

            {/* Profile List */}
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => {
                  onSwitch(profile);
                  setIsOpen(false);
                }}
                className={`w-full flex items-start space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  profile.id === activeProfile.id ? 'bg-primary-50' : ''
                }`}
              >
                <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-medium text-primary-700">
                    {getInitials(profile.name)}
                  </span>
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-800">{profile.name}</p>
                    {profile.id === activeProfile.id && (
                      <Check className="w-4 h-4 text-primary-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{profile.stokvelName}</p>
                  
                  {/* Progress Bar */}
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Progress</span>
                      <span className="font-medium text-primary-600">{profile.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-primary-600 h-1.5 rounded-full" 
                        style={{ width: `${profile.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs mt-2">
                    <span className="text-gray-500">R {profile.savedAmount.toLocaleString()}</span>
                    <span className="text-gray-500">of R {profile.targetAmount.toLocaleString()}</span>
                  </div>
                </div>
              </button>
            ))}

            {/* Add Profile Option */}
            {onAddProfile && (
              <div className="border-t border-gray-100 mt-2 pt-2">
                <button
                  onClick={() => {
                    onAddProfile();
                    setIsOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors text-gray-600"
                >
                  <PlusCircle className="w-5 h-5" />
                  <span className="text-sm">Add another profile</span>
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-100 mt-2 pt-2 px-4 py-2">
              <Link
                to="/profile"
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-primary-600"
                onClick={() => setIsOpen(false)}
              >
                <Users className="w-4 h-4" />
                <span>Manage Profiles</span>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
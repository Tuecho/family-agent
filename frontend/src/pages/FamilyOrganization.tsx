import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Users, RefreshCw, Gift, Star, CheckCircle, MessageCircle, Mail, Copy, FacebookIcon, TwitterIcon, X, Trophy, PawPrint, ShoppingCart } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface Chore {
  id: string;
  name: string;
  description: string | null;
  category: string;
  rotation_type: string;
  assigned_members: number[] | null;
}

interface Assignment {
  id: string;
  chore_id: string;
  member_id: number;
  chore_name: string;
  member_name: string;
  week_start: string;
  completed: number;
  completed_at: string | null;
}

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  icon: string;
  active: number;
}

interface MemberPoints {
  member_id: number;
  member_name: string;
  total_points: number;
  week_points: number;
}

interface FamilyMember {
  id: number;
  name: string;
  age_group: string;
}

const CHORE_CATEGORIES = [
  { value: 'cocina', label: 'Cocina', icon: '🍳' },
  { value: 'limpieza', label: 'Limpieza', icon: '🧹' },
  { value: 'mascotas', label: 'Mascotas', icon: '🐕' },
  { value: 'compras', label: 'Compras', icon: '🛒' },
  { value: 'lavado', label: 'Lavandería', icon: '👕' },
  { value: 'general', label: 'General', icon: '📋' },
];

const CHORE_POINTS: Record<string, number> = {
  cocina: 10,
  limpieza: 10,
  mascotas: 15,
  compras: 10,
  lavandería: 10,
  general: 5,
};

export function FamilyOrganization() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [memberPoints, setMemberPoints] = useState<MemberPoints[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showChoreModal, setShowChoreModal] = useState(false);
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'chores' | 'rewards'>('chores');

  const [choreForm, setChoreForm] = useState({
    name: '',
    description: '',
    category: 'general',
    rotation_type: 'weekly',
    assigned_members: [] as number[],
  });

  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    points_required: 50,
    icon: '🎁',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = getAuthHeaders();
      const [choresRes, assignmentsRes, rewardsRes, pointsRes, membersRes] = await Promise.all([
        fetch(`${API_URL}/api/family/household-chores`, { headers }),
        fetch(`${API_URL}/api/family/chore-assignments`, { headers }),
        fetch(`${API_URL}/api/family/rewards`, { headers }),
        fetch(`${API_URL}/api/family/member-points`, { headers }),
        fetch(`${API_URL}/api/family-members`, { headers }),
      ]);
      
      const choresData = await choresRes.json();
      const assignmentsData = await assignmentsRes.json();
      const rewardsData = await rewardsRes.json();
      const pointsData = await pointsRes.json();
      const membersData = await membersRes.json();
      
      setChores(Array.isArray(choresData) ? choresData : []);
      setAssignments(Array.isArray(assignmentsData) ? assignmentsData : []);
      setRewards(Array.isArray(rewardsData) ? rewardsData : []);
      setMemberPoints(Array.isArray(pointsData) ? pointsData : []);
      setFamilyMembers(Array.isArray(membersData) ? membersData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeekStart = () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(now.setDate(diff)).toISOString().split('T')[0];
  };

  const handleChoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const url = editingChore 
        ? `${API_URL}/api/family/household-chores/${editingChore.id}` 
        : `${API_URL}/api/family/household-chores`;
      const method = editingChore ? 'PUT' : 'POST';
      
      const res = await fetch(url, { method, headers, body: JSON.stringify(choreForm) });
      if (res.ok) {
        fetchData();
        resetChoreForm();
      }
    } catch (error) {
      console.error('Error saving chore:', error);
    }
  };

  const handleRewardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const res = await fetch(`${API_URL}/api/family/rewards`, { 
        method: 'POST', 
        headers, 
        body: JSON.stringify(rewardForm) 
      });
      if (res.ok) {
        fetchData();
        setRewardForm({ name: '', description: '', points_required: 50, icon: '🎁' });
        setShowRewardModal(false);
      }
    } catch (error) {
      console.error('Error saving reward:', error);
    }
  };

  const handleDeleteChore = async (id: string) => {
    if (!confirm('¿Eliminar esta tarea?')) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/family/household-chores/${id}`, { method: 'DELETE', headers });
      fetchData();
    } catch (error) {
      console.error('Error deleting chore:', error);
    }
  };

  const handleDeleteReward = async (id: string) => {
    if (!confirm('¿Eliminar esta recompensa?')) return;
    try {
      const headers = getAuthHeaders();
      await fetch(`${API_URL}/api/family/rewards/${id}`, { method: 'DELETE', headers });
      fetchData();
    } catch (error) {
      console.error('Error deleting reward:', error);
    }
  };

  const handleCompleteAssignment = async (assignment: Assignment) => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const points = CHORE_POINTS[chores.find(c => c.id === assignment.chore_id)?.category || 'general'] || 5;
      
      await fetch(`${API_URL}/api/family/chore-assignments/${assignment.id}/complete`, { 
        method: 'POST', 
        headers, 
        body: JSON.stringify({ member_id: assignment.member_id, points }) 
      });
      fetchData();
    } catch (error) {
      console.error('Error completing assignment:', error);
    }
  };

  const handleRotateChore = async (choreId: string) => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/family/chore-assignments/rotate`, { 
        method: 'POST', 
        headers, 
        body: JSON.stringify({ chore_id: choreId, week_start: getCurrentWeekStart() }) 
      });
      fetchData();
    } catch (error) {
      console.error('Error rotating chore:', error);
    }
  };

  const handleRedeemReward = async (memberId: number, rewardId: string) => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      await fetch(`${API_URL}/api/family/member-points/${memberId}/redeem`, { 
        method: 'POST', 
        headers, 
        body: JSON.stringify({ reward_id: rewardId }) 
      });
      fetchData();
    } catch (error) {
      console.error('Error redeeming reward:', error);
    }
  };

  const resetChoreForm = () => {
    setShowChoreModal(false);
    setEditingChore(null);
    setChoreForm({ name: '', description: '', category: 'general', rotation_type: 'weekly', assigned_members: [] });
  };

  const openEditChore = (chore: Chore) => {
    setEditingChore(chore);
    setChoreForm({
      name: chore.name,
      description: chore.description || '',
      category: chore.category,
      rotation_type: chore.rotation_type,
      assigned_members: chore.assigned_members || [],
    });
    setShowChoreModal(true);
  };

  const generateShareText = () => {
    const currentWeekAssignments = assignments.filter(a => a.week_start === getCurrentWeekStart());
    const header = '👨‍👩‍👧‍👦 *Organización Familiar*\n\n';
    const pending = currentWeekAssignments.filter(a => !a.completed);
    const completed = currentWeekAssignments.filter(a => a.completed);
    
    let content = '*Tareas pendientes:*\n';
    if (pending.length === 0) {
      content += '  ✓ No hay tareas pendientes\n';
    } else {
      pending.forEach((a, i) => {
        content += `${i + 1}. ${a.chore_name} - ${a.member_name || 'Sin asignar'}\n`;
      });
    }
    
    if (completed.length > 0) {
      content += '\n*Completadas:*\n';
      completed.forEach((a) => {
        content += `  ✓ ${a.chore_name}\n`;
      });
    }
    
    if (gamificationEnabled && memberPoints.length > 0) {
      content += '\n*🏆 Puntos:*\n';
      memberPoints.forEach(mp => {
        content += `  ${mp.member_name}: ${mp.total_points} pts\n`;
      });
    }
    
    const footer = '\n---\nEnviado desde Family Agent';
    return header + content + footer;
  };

  const shareToWhatsApp = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const shareToTelegram = () => {
    const text = encodeURIComponent(generateShareText());
    window.open(`https://t.me/share/url?url=&text=${text}`, '_blank');
  };

  const shareByEmail = () => {
    const subject = encodeURIComponent('Organización Familiar - Semanal');
    const body = encodeURIComponent(generateShareText().replace(/[*_]/g, ''));
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const copyToClipboard = async () => {
    const text = generateShareText().replace(/[*_]/g, '');
    await navigator.clipboard.writeText(text);
    alert('¡Contenido copiado al portapapeles!');
  };

  const currentWeekAssignments = assignments.filter(a => a.week_start === getCurrentWeekStart());
  const pendingAssignments = currentWeekAssignments.filter(a => !a.completed);
  const completedAssignments = currentWeekAssignments.filter(a => a.completed);

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-3 rounded-xl">
            <Users size={28} className="text-emerald-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Organización Familiar</h2>
            <p className="text-sm text-gray-500">
              {pendingAssignments.length} tareas pendientes esta semana
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={gamificationEnabled} 
              onChange={(e) => setGamificationEnabled(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="text-sm text-gray-600">Gamificación</span>
          </label>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('chores')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'chores' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <RefreshCw size={18} className="inline mr-2" />
          Tareas del Hogar
        </button>
        <button
          onClick={() => setActiveTab('rewards')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'rewards' 
              ? 'bg-emerald-600 text-white' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Gift size={18} className="inline mr-2" />
          Recompensas
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Cargando...</div>
      ) : activeTab === 'chores' ? (
        <>
          <div className="bg-white rounded-xl border p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <MessageCircle size={16} />
                Compartir tareas
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={shareToWhatsApp}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
              >
                <MessageCircle size={16} />
                WhatsApp
              </button>
              <button
                onClick={shareToTelegram}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram
              </button>
              <button
                onClick={shareByEmail}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                <Mail size={16} />
                Email
              </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Copy size={16} />
                Copiar
              </button>
            </div>
          </div>

          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowChoreModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus size={20} />
              <span>Nueva Tarea</span>
            </button>
          </div>

          {chores.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-5xl mb-4">🏠</div>
              <p className="text-lg text-gray-600 font-medium">No hay tareas del hogar</p>
              <p className="text-sm text-gray-400 mt-1">Añade tareas como "Fregar platos", "Sacar al perro"...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingAssignments.length > 0 && (
                <div className="bg-white rounded-xl border p-4 shadow-sm">
                  <h3 className="font-semibold text-gray-700 mb-3">Esta Semana</h3>
                  <div className="space-y-2">
                    {pendingAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">
                            {CHORE_CATEGORIES.find(c => c.value === chores.find(c => c.id === assignment.chore_id)?.category)?.icon || '📋'}
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">{assignment.chore_name}</p>
                            <p className="text-sm text-gray-500">{assignment.member_name || 'Sin asignar'}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {gamificationEnabled && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
                              +{CHORE_POINTS[chores.find(c => c.id === assignment.chore_id)?.category || 'general']} pts
                            </span>
                          )}
                          <button
                            onClick={() => handleCompleteAssignment(assignment)}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                            title="Completar"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            onClick={() => handleRotateChore(assignment.chore_id)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Rotar"
                          >
                            <RefreshCw size={18} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {completedAssignments.length > 0 && (
                <div className="bg-white rounded-xl border p-4 shadow-sm opacity-70">
                  <h3 className="font-semibold text-gray-700 mb-3">Completadas</h3>
                  <div className="space-y-2">
                    {completedAssignments.map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg line-through">
                        <div className="flex items-center gap-3">
                          <CheckCircle size={20} className="text-emerald-500" />
                          <div>
                            <p className="font-medium text-gray-500">{assignment.chore_name}</p>
                            <p className="text-sm text-gray-400">{assignment.member_name}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded-xl border p-4 shadow-sm">
                <h3 className="font-semibold text-gray-700 mb-3">Todas las Tareas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {chores.map((chore) => (
                    <div key={chore.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {CHORE_CATEGORIES.find(c => c.value === chore.category)?.icon || '📋'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{chore.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{chore.rotation_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditChore(chore)}
                          className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteChore(chore.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {gamificationEnabled && memberPoints.length > 0 && (
            <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 mb-6 text-white">
              <h3 className="font-bold flex items-center gap-2 mb-3">
                <Trophy size={20} />
                Clasificación
              </h3>
              <div className="space-y-2">
                {memberPoints.sort((a, b) => b.total_points - a.total_points).map((mp, idx) => (
                  <div key={mp.member_id} className="flex items-center justify-between bg-white/20 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{idx + 1}</span>
                      <span>{mp.member_name}</span>
                    </div>
                    <span className="font-bold">{mp.total_points} pts</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowRewardModal(true)}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Plus size={20} />
              <span>Nueva Recompensa</span>
            </button>
          </div>

          {rewards.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <div className="text-5xl mb-4">🎁</div>
              <p className="text-lg text-gray-600 font-medium">No hay recompensas</p>
              <p className="text-sm text-gray-400 mt-1">Añade recompensas para motivar a los niños</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rewards.map((reward) => (
                <div key={reward.id} className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-3xl">{reward.icon}</span>
                      <div>
                        <p className="font-bold text-gray-800">{reward.name}</p>
                        <p className="text-sm text-gray-500">{reward.points_required} puntos</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteReward(reward.id)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  {reward.description && (
                    <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                  )}
                  {familyMembers.length > 0 && gamificationEnabled && (
                    <div className="flex flex-wrap gap-2">
                      {familyMembers.filter(m => m.age_group === 'child').map((member) => {
                        const mp = memberPoints.find(p => p.member_id === member.id);
                        const canRedeem = mp && mp.total_points >= reward.points_required;
                        return (
                          <button
                            key={member.id}
                            onClick={() => canRedeem && handleRedeemReward(member.id, reward.id)}
                            disabled={!canRedeem}
                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                              canRedeem 
                                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {member.name} {canRedeem ? '🎉' : `(${(mp?.total_points || 0)}/${reward.points_required})`}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showChoreModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">
                {editingChore ? 'Editar Tarea' : 'Nueva Tarea'}
              </h3>
              <button onClick={resetChoreForm} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleChoreSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={choreForm.name}
                  onChange={(e) => setChoreForm({ ...choreForm, name: e.target.value })}
                  placeholder="Ej: Fregar platos, Sacar al perro..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={choreForm.description}
                  onChange={(e) => setChoreForm({ ...choreForm, description: e.target.value })}
                  placeholder="Detalles adicionales..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  value={choreForm.category}
                  onChange={(e) => setChoreForm({ ...choreForm, category: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  {CHORE_CATEGORIES.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de rotación</label>
                <select
                  value={choreForm.rotation_type}
                  onChange={(e) => setChoreForm({ ...choreForm, rotation_type: e.target.value })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="weekly">Semanal</option>
                  <option value="daily">Diario</option>
                  <option value="biweekly">Quincenal</option>
                  <option value="manual">Manual</option>
                </select>
              </div>
              {familyMembers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Asignar a</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {familyMembers.map((member) => (
                      <label key={member.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={choreForm.assigned_members.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setChoreForm({ ...choreForm, assigned_members: [...choreForm.assigned_members, member.id] });
                            } else {
                              setChoreForm({ ...choreForm, assigned_members: choreForm.assigned_members.filter(id => id !== member.id) });
                            }
                          }}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                        <span>{member.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={resetChoreForm}
                  className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-sm"
                >
                  {editingChore ? 'Guardar' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRewardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Nueva Recompensa</h3>
              <button onClick={() => setShowRewardModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRewardSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={rewardForm.name}
                  onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                  placeholder="Ej: 30 min de videojuegos, Helado..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <input
                  type="text"
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="Detalles..."
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Puntos requeridos</label>
                <input
                  type="number"
                  value={rewardForm.points_required}
                  onChange={(e) => setRewardForm({ ...rewardForm, points_required: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Icono</label>
                <div className="flex flex-wrap gap-2">
                  {['🎁', '🍦', '🎮', '🎬', '⏰', '🛒', '⭐', '🏆'].map((icon) => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setRewardForm({ ...rewardForm, icon })}
                      className={`w-10 h-10 rounded-lg text-xl transition-colors ${
                        rewardForm.icon === icon 
                          ? 'bg-emerald-100 border-2 border-emerald-500' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRewardModal(false)}
                  className="flex-1 py-3 border rounded-xl text-gray-600 hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-medium shadow-sm"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

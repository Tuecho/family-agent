import { useState, useEffect, Fragment as ReactFragment } from 'react';
import { Utensils, Users, Plus, X, Trash2, Edit2, Heart, ShoppingCart, ChevronLeft, ChevronRight, Save, ChefHat, AlertTriangle, Baby, User, GraduationCap, Accessibility } from 'lucide-react';
import { getAuthHeaders } from '../utils/auth';

const API_URL = import.meta.env.VITE_API_URL || '';

interface FamilyMember {
  id: number;
  name: string;
  age_group: string;
  restrictions: string;
  allergies: string;
  intolerances: string;
  notes: string;
}

interface Recipe {
  id: number;
  name: string;
  description: string;
  ingredients: string;
  instructions: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  category: string;
  restrictions: string;
  contains: string;
  is_favorite: number;
}

interface MealPlan {
  id: number;
  week_start: string;
  day_of_week: number;
  meal_type: string;
  recipe_id: number | null;
  recipe_name: string;
  notes: string;
}

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'];
const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Desayuno',
  lunch: 'Comida',
  dinner: 'Cena',
  snack: 'Merienda'
};

const AGE_GROUPS = [
  ['baby', 'Bebé (0-2 años)', Baby],
  ['child', 'Niño (3-12 años)', User],
  ['teen', 'Adolescente', GraduationCap],
  ['adult', 'Adulto', User],
  ['senior', 'Mayor (65+)', Accessibility]
];

const RESTRICTIONS = [
  ['gluten_free', 'Sin Gluten', '🌾'],
  ['dairy_free', 'Sin Lácteos', '🥛'],
  ['egg_free', 'Sin Huevos', '🥚'],
  ['nut_free', 'Sin Frutos secos', '🥜'],
  ['vegan', 'Vegano', '🥬'],
  ['vegetarian', 'Vegetariano', '🥕'],
  ['soft', 'Blanda (mayores)', '🍲'],
  ['kids', 'Apto para niños', '👶']
];

const RECIPE_CATEGORIES = [
  ['breakfast', 'Desayuno'],
  ['lunch', 'Comida'],
  ['dinner', 'Cena'],
  ['snack', 'Merienda'],
  ['dessert', 'Postre'],
  ['main', 'Plato principal'],
  ['side', 'Acompañamiento'],
  ['soup', 'Sopa'],
  ['salad', 'Ensalada']
];

function getWeekStart(date: Date): string {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function MealPlanning() {
  const [activeTab, setActiveTab] = useState<'planning' | 'recipes' | 'members'>('planning');
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlans, setMealPlans] = useState<MealPlan[]>([]);
  const [weekStart, setWeekStart] = useState(getWeekStart(new Date()));
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<{day: number; meal: string} | null>(null);
  const [shoppingList, setShoppingList] = useState<{name: string; amount: number; unit: string}[]>([]);
  
  const [memberForm, setMemberForm] = useState({
    name: '', age_group: 'adult', restrictions: [] as string[], allergies: '', intolerances: '', notes: ''
  });
  
  const [recipeForm, setRecipeForm] = useState({
    name: '', description: '', ingredients: '', instructions: '',
    prep_time: 0, cook_time: 0, servings: 4, category: 'main',
    restrictions: [] as string[], contains: [] as string[]
  });

  useEffect(() => {
    fetchMembers();
    fetchRecipes();
    fetchMealPlans();
  }, [weekStart]);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/family-members`, { headers: getAuthHeaders() });
      const data = await res.json();
      setMembers(data);
    } catch (e) { console.error(e); }
  };

  const fetchRecipes = async () => {
    try {
      const res = await fetch(`${API_URL}/api/recipes`, { headers: getAuthHeaders() });
      const data = await res.json();
      setRecipes(data);
    } catch (e) { console.error(e); }
  };

  const fetchMealPlans = async () => {
    try {
      const res = await fetch(`${API_URL}/api/meal-plans?week_start=${weekStart}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setMealPlans(data);
    } catch (e) { console.error(e); }
  };

  const fetchShoppingList = async () => {
    try {
      const res = await fetch(`${API_URL}/api/meal-plans/shopping-list?week_start=${weekStart}`, { headers: getAuthHeaders() });
      const data = await res.json();
      setShoppingList(data);
    } catch (e) { console.error(e); }
  };

  const handleSaveMember = async () => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const body = {
        name: memberForm.name,
        age_group: memberForm.age_group,
        restrictions: memberForm.restrictions.join(','),
        allergies: memberForm.allergies,
        intolerances: memberForm.intolerances,
        notes: memberForm.notes
      };
      
      if (editingMember) {
        await fetch(`${API_URL}/api/family-members/${editingMember.id}`, {
          method: 'PUT', headers, body: JSON.stringify(body)
        });
      } else {
        await fetch(`${API_URL}/api/family-members`, {
          method: 'POST', headers, body: JSON.stringify(body)
        });
      }
      
      setShowMemberModal(false);
      setEditingMember(null);
      setMemberForm({ name: '', age_group: 'adult', restrictions: [], allergies: '', intolerances: '', notes: '' });
      fetchMembers();
    } catch (e) { console.error(e); }
  };

  const handleDeleteMember = async (id: number) => {
    if (!confirm('¿Eliminar este miembro?')) return;
    await fetch(`${API_URL}/api/family-members/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    fetchMembers();
  };

  const handleSaveRecipe = async () => {
    try {
      const headers = { ...getAuthHeaders(), 'Content-Type': 'application/json' };
      const body = {
        name: recipeForm.name,
        description: recipeForm.description,
        ingredients: recipeForm.ingredients,
        instructions: recipeForm.instructions,
        prep_time: recipeForm.prep_time,
        cook_time: recipeForm.cook_time,
        servings: recipeForm.servings,
        category: recipeForm.category,
        restrictions: recipeForm.restrictions.join(','),
        contains: recipeForm.contains.join(',')
      };
      
      if (editingRecipe) {
        await fetch(`${API_URL}/api/recipes/${editingRecipe.id}`, {
          method: 'PUT', headers, body: JSON.stringify({ ...body, is_favorite: editingRecipe.is_favorite })
        });
      } else {
        await fetch(`${API_URL}/api/recipes`, {
          method: 'POST', headers, body: JSON.stringify(body)
        });
      }
      
      setShowRecipeModal(false);
      setEditingRecipe(null);
      setRecipeForm({ name: '', description: '', ingredients: '', instructions: '', prep_time: 0, cook_time: 0, servings: 4, category: 'main', restrictions: [], contains: [] });
      fetchRecipes();
    } catch (e) { console.error(e); }
  };

  const handleDeleteRecipe = async (id: number) => {
    if (!confirm('¿Eliminar esta receta?')) return;
    await fetch(`${API_URL}/api/recipes/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    fetchRecipes();
  };

  const handleToggleFavorite = async (recipe: Recipe) => {
    await fetch(`${API_URL}/api/recipes/${recipe.id}/favorite`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_favorite: recipe.is_favorite ? 0 : 1 })
    });
    fetchRecipes();
  };

  const handleAssignRecipe = async (recipe: Recipe) => {
    if (!selectedSlot) return;
    try {
      await fetch(`${API_URL}/api/meal-plans`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_start: weekStart,
          day_of_week: selectedSlot.day,
          meal_type: selectedSlot.meal,
          recipe_id: recipe.id,
          recipe_name: recipe.name
        })
      });
      setShowPlanModal(false);
      setSelectedSlot(null);
      fetchMealPlans();
    } catch (e) { console.error(e); }
  };

  const handleRemoveMeal = async (planId: number) => {
    await fetch(`${API_URL}/api/meal-plans/${planId}`, { method: 'DELETE', headers: getAuthHeaders() });
    fetchMealPlans();
  };

  const getMealForSlot = (day: number, meal: string) => {
    return mealPlans.find(p => p.day_of_week === day && p.meal_type === meal);
  };

  const checkRecipeCompatibility = (recipe: Recipe) => {
    const allRestrictions = members.flatMap(m => m.restrictions.split(',')).filter(Boolean);
    const recipeRestrictions = recipe.restrictions.split(',');
    const recipeContains = recipe.contains.split(',');
    
    const warnings = [];
    for (const r of allRestrictions) {
      if (!recipeRestrictions.includes(r) && r !== 'soft' && r !== 'kids') {
        if (recipeContains.some(c => c && r.includes(c.replace('_free', '')))) {
          warnings.push(`Contiene: ${r}`);
        }
      }
    }
    return warnings;
  };

  const changeWeek = (delta: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(getWeekStart(d));
  };

  const formatDateRange = () => {
    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    return `${start.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  };

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-orange-100 p-2 sm:p-3 rounded-xl">
            <Utensils size={24} className="text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Planificación de Comidas</h2>
            <p className="text-sm text-gray-500">{members.length} miembros · {recipes.length} recetas</p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: 'planning', label: 'Plan Semanal', icon: ChefHat },
          { key: 'recipes', label: 'Recetas', icon: Heart },
          { key: 'members', label: 'Familia', icon: Users }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-orange-500 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50 border'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'planning' && (
        <>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center justify-center gap-2">
              <button onClick={() => changeWeek(-1)} className="p-2 bg-white rounded-lg border hover:bg-gray-50">
                <ChevronLeft size={20} />
              </button>
              <span className="font-medium px-2 sm:px-4 text-sm sm:text-base">{formatDateRange()}</span>
              <button onClick={() => changeWeek(1)} className="p-2 bg-white rounded-lg border hover:bg-gray-50">
                <ChevronRight size={20} />
              </button>
            </div>
            <button
              onClick={() => { fetchShoppingList(); setShowShoppingModal(true); }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm"
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">Lista de compra</span>
              <span className="sm:hidden">Compra</span>
            </button>
          </div>

          {members.length > 0 && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-orange-800">Restricciones:</span>
              {members.map(m => m.restrictions.split(',').filter(Boolean).map((r, i) => (
                <span key={i} className="text-xs bg-white px-2 py-1 rounded-full border border-orange-200 flex items-center gap-1">
                  {m.name}: {RESTRICTIONS.find(x => x[0] === r)?.[1] || r}
                </span>
              )))}
              {members.filter(m => m.allergies).map(m => (
                <span key={`a-${m.id}`} className="text-xs bg-red-100 px-2 py-1 rounded-full border border-red-200 flex items-center gap-1">
                  <AlertTriangle size={12} /> {m.name}: {m.allergies}
                </span>
              ))}
            </div>
          )}

          <div className="hidden md:block overflow-x-auto">
            <div className="grid grid-cols-8 gap-2 min-w-[800px]">
              <div className="sticky left-0 bg-white p-2 font-medium text-sm text-gray-500"></div>
              {DAYS.map(day => (
                <div key={day} className="bg-orange-100 p-2 text-center font-medium text-sm rounded-lg">
                  {day}
                </div>
              ))}
              
              {MEAL_TYPES.map(meal => (
                <ReactFragment key={meal}>
                  <div className="sticky left-0 bg-white p-2 font-medium text-sm text-gray-600 flex items-center">
                    {MEAL_LABELS[meal]}
                  </div>
                  {DAYS.map((_, idx) => {
                    const plan = getMealForSlot(idx + 1, meal);
                    const warnings = plan ? checkRecipeCompatibility(recipes.find(r => r.id === plan.recipe_id) || { restrictions: '', contains: '' }) : [];
                    return (
                      <div
                        key={`${meal}-${idx}`}
                        className={`min-h-[80px] p-2 rounded-lg border-2 border-dashed cursor-pointer transition-colors ${
                          plan ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-200 hover:border-orange-300'
                        }`}
                        onClick={() => {
                          if (!plan) {
                            setSelectedSlot({ day: idx + 1, meal });
                            setShowPlanModal(true);
                          }
                        }}
                      >
                        {plan ? (
                          <div className="relative">
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRemoveMeal(plan.id); }}
                              className="absolute -top-1 -right-1 p-1 bg-red-100 rounded-full text-red-500 hover:bg-red-200"
                            >
                              <X size={12} />
                            </button>
                            <p className="text-sm font-medium text-gray-800 pr-4">{plan.recipe_name}</p>
                            {warnings.length > 0 && (
                              <p className="text-xs text-red-500 mt-1">{warnings[0]}</p>
                            )}
                          </div>
                        ) : (
                          <div className="h-full flex items-center justify-center text-gray-400">
                            <Plus size={20} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </ReactFragment>
              ))}
            </div>
          </div>

          <div className="md:hidden space-y-4">
            {DAYS.map((day, dayIdx) => (
              <div key={day} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="bg-orange-100 p-3 text-center font-semibold">
                  {day}
                </div>
                <div className="p-3 space-y-3">
                  {MEAL_TYPES.map(meal => {
                    const plan = getMealForSlot(dayIdx + 1, meal);
                    const warnings = plan ? checkRecipeCompatibility(recipes.find(r => r.id === plan.recipe_id) || { restrictions: '', contains: '' }) : [];
                    return (
                      <div key={meal} className="flex items-center gap-3">
                        <span className="text-xs font-medium text-gray-500 w-16">{MEAL_LABELS[meal]}</span>
                        {plan ? (
                          <div className="flex-1 flex items-center justify-between bg-gray-50 rounded-lg p-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-800 truncate">{plan.recipe_name}</p>
                              {warnings.length > 0 && (
                                <p className="text-xs text-red-500">{warnings[0]}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleRemoveMeal(plan.id)}
                              className="p-1 text-red-400 hover:text-red-600"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedSlot({ day: dayIdx + 1, meal });
                              setShowPlanModal(true);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-50 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                          >
                            <Plus size={16} />
                            <span className="text-sm">Añadir</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'recipes' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <input
              type="text"
              placeholder="Buscar recetas..."
              className="px-4 py-2 border rounded-lg w-full max-w-xs"
              onChange={(e) => {
                const search = e.target.value;
                fetch(`${API_URL}/api/recipes?search=${search}`, { headers: getAuthHeaders() })
                  .then(r => r.json()).then(setRecipes);
              }}
            />
            <button
              onClick={() => { setEditingRecipe(null); setRecipeForm({ name: '', description: '', ingredients: '', instructions: '', prep_time: 0, cook_time: 0, servings: 4, category: 'main', restrictions: [], contains: [] }); setShowRecipeModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Plus size={18} /> Nueva receta
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map(recipe => (
              <div key={recipe.id} className="bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-gray-800">{recipe.name}</h3>
                  <div className="flex gap-1">
                    <button onClick={() => handleToggleFavorite(recipe)} className={`p-1 rounded ${recipe.is_favorite ? 'text-red-500' : 'text-gray-300'}`}>
                      <Heart size={18} fill={recipe.is_favorite ? 'currentColor' : 'none'} />
                    </button>
                    <button onClick={() => { setEditingRecipe(recipe); setRecipeForm({ name: recipe.name, description: recipe.description, ingredients: recipe.ingredients, instructions: recipe.instructions, prep_time: recipe.prep_time || 0, cook_time: recipe.cook_time || 0, servings: recipe.servings || 4, category: recipe.category, restrictions: recipe.restrictions.split(','), contains: recipe.contains.split(',') }); setShowRecipeModal(true); }} className="p-1 text-gray-400 hover:text-blue-500">
                      <Edit2 size={18} />
                    </button>
                    <button onClick={() => handleDeleteRecipe(recipe.id)} className="p-1 text-gray-400 hover:text-red-500">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500 mb-2">{recipe.description}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {recipe.restrictions.split(',').filter(Boolean).map((r, i) => (
                    <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                      {RESTRICTIONS.find(x => x[0] === r)?.[1] || r}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-gray-400">
                  ⏱️ {recipe.prep_time + recipe.cook_time} min · 👥 {recipe.servings} personas
                </div>
              </div>
            ))}
            {recipes.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <ChefHat size={48} className="mx-auto mb-4 opacity-50" />
                <p>No hay recetas aún</p>
                <p className="text-sm">Crea tu primera receta</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'members' && (
        <>
          <div className="flex justify-between items-center mb-4">
            <p className="text-gray-600">Gestiona los miembros de la familia y sus restricciones dietéticas</p>
            <button
              onClick={() => { setEditingMember(null); setMemberForm({ name: '', age_group: 'adult', restrictions: [], allergies: '', intolerances: '', notes: '' }); setShowMemberModal(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
            >
              <Plus size={18} /> Nuevo miembro
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {members.map(member => {
              const AgeIcon = AGE_GROUPS.find(x => x[0] === member.age_group)?.[2] || User;
              return (
                <div key={member.id} className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <AgeIcon size={20} className="text-orange-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{member.name}</h3>
                        <p className="text-xs text-gray-500">{AGE_GROUPS.find(x => x[0] === member.age_group)?.[1]}</p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditingMember(member); setMemberForm({ name: member.name, age_group: member.age_group, restrictions: member.restrictions.split(','), allergies: member.allergies, intolerances: member.intolerances, notes: member.notes }); setShowMemberModal(true); }} className="p-1 text-gray-400 hover:text-blue-500">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => handleDeleteMember(member.id)} className="p-1 text-gray-400 hover:text-red-500">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {member.restrictions.split(',').filter(Boolean).map((r, i) => (
                      <span key={i} className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        {RESTRICTIONS.find(x => x[0] === r)?.[1] || r}
                      </span>
                    ))}
                  </div>
                  {member.allergies && (
                    <div className="text-xs text-red-600 flex items-center gap-1">
                      <AlertTriangle size={12} /> Alergias: {member.allergies}
                    </div>
                  )}
                  {member.intolerances && (
                    <div className="text-xs text-orange-600 mt-1">
                      Intolerancias: {member.intolerances}
                    </div>
                  )}
                </div>
              );
            })}
            {members.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <Users size={48} className="mx-auto mb-4 opacity-50" />
                <p>No hay miembros añadidos</p>
                <p className="text-sm">Añade los miembros de tu familia</p>
              </div>
            )}
          </div>
        </>
      )}

      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingMember ? 'Editar' : 'Nuevo'} miembro</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={memberForm.name}
                  onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Ej: María, Juan..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Grupo de edad</label>
                <select
                  value={memberForm.age_group}
                  onChange={e => setMemberForm({ ...memberForm, age_group: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  {AGE_GROUPS.map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Restricciones dietéticas</label>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTIONS.map(([key, label, emoji]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const newRestrictions = memberForm.restrictions.includes(key)
                          ? memberForm.restrictions.filter(r => r !== key)
                          : [...memberForm.restrictions, key];
                        setMemberForm({ ...memberForm, restrictions: newRestrictions });
                      }}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        memberForm.restrictions.includes(key)
                          ? 'bg-green-100 border-green-300 text-green-700'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alergias</label>
                <input
                  type="text"
                  value={memberForm.allergies}
                  onChange={e => setMemberForm({ ...memberForm, allergies: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Ej: Cacahuetes, mariscos..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Intolerancias</label>
                <input
                  type="text"
                  value={memberForm.intolerances}
                  onChange={e => setMemberForm({ ...memberForm, intolerances: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="Ej: Lactosa, gluten..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Notas</label>
                <textarea
                  value={memberForm.notes}
                  onChange={e => setMemberForm({ ...memberForm, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowMemberModal(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleSaveMember} className="flex-1 py-2 bg-orange-500 text-white rounded-lg">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showRecipeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{editingRecipe ? 'Editar' : 'Nueva'} receta</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input
                  type="text"
                  value={recipeForm.name}
                  onChange={e => setRecipeForm({ ...recipeForm, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Categoría</label>
                  <select
                    value={recipeForm.category}
                    onChange={e => setRecipeForm({ ...recipeForm, category: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg"
                  >
                    {RECIPE_CATEGORIES.map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Porciones</label>
                  <input
                    type="number"
                    value={recipeForm.servings}
                    onChange={e => setRecipeForm({ ...recipeForm, servings: parseInt(e.target.value) || 4 })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tiempo prep. (min)</label>
                  <input
                    type="number"
                    value={recipeForm.prep_time}
                    onChange={e => setRecipeForm({ ...recipeForm, prep_time: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tiempo coc. (min)</label>
                  <input
                    type="number"
                    value={recipeForm.cook_time}
                    onChange={e => setRecipeForm({ ...recipeForm, cook_time: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={recipeForm.description}
                  onChange={e => setRecipeForm({ ...recipeForm, description: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Ingredientes (uno por línea)</label>
                <textarea
                  value={recipeForm.ingredients}
                  onChange={e => setRecipeForm({ ...recipeForm, ingredients: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg font-mono text-sm"
                  rows={6}
                  placeholder="200g pasta&#10;100g tomate&#10;1 cebolla"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Instrucciones</label>
                <textarea
                  value={recipeForm.instructions}
                  onChange={e => setRecipeForm({ ...recipeForm, instructions: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apta para</label>
                <div className="flex flex-wrap gap-2">
                  {RESTRICTIONS.map(([key, label, emoji]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const newRestrictions = recipeForm.restrictions.includes(key)
                          ? recipeForm.restrictions.filter(r => r !== key)
                          : [...recipeForm.restrictions, key];
                        setRecipeForm({ ...recipeForm, restrictions: newRestrictions });
                      }}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        recipeForm.restrictions.includes(key)
                          ? 'bg-green-100 border-green-300 text-green-700'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {emoji} {label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Contiene (alérgenos)</label>
                <div className="flex flex-wrap gap-2">
                  {[['gluten', '🌾 Gluten'], ['dairy', '🥛 Lácteos'], ['eggs', '🥚 Huevos'], ['nuts', '🥜 Frutos secos'], ['fish', '🐟 Pescado'], ['shellfish', '🦐 Mariscos'], ['soy', '🫘 Soja']].map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => {
                        const newContains = recipeForm.contains.includes(key)
                          ? recipeForm.contains.filter(c => c !== key)
                          : [...recipeForm.contains, key];
                        setRecipeForm({ ...recipeForm, contains: newContains });
                      }}
                      className={`px-3 py-1 rounded-full text-sm border ${
                        recipeForm.contains.includes(key)
                          ? 'bg-red-100 border-red-300 text-red-700'
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowRecipeModal(false)} className="flex-1 py-2 border rounded-lg">Cancelar</button>
              <button onClick={handleSaveRecipe} className="flex-1 py-2 bg-orange-500 text-white rounded-lg">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {showPlanModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">Seleccionar receta para {selectedSlot && DAYS[selectedSlot.day - 1]} - {selectedSlot && MEAL_LABELS[selectedSlot.meal]}</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recipes.map(recipe => {
                const warnings = checkRecipeCompatibility(recipe);
                return (
                  <button
                    key={recipe.id}
                    onClick={() => handleAssignRecipe(recipe)}
                    className={`w-full text-left p-3 rounded-lg border ${warnings.length > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200 hover:border-orange-300'}`}
                  >
                    <div className="flex justify-between">
                      <span className="font-medium">{recipe.name}</span>
                      <span className="text-xs text-gray-500">{RECIPE_CATEGORIES.find(c => c[0] === recipe.category)?.[1]}</span>
                    </div>
                    {warnings.length > 0 && (
                      <p className="text-xs text-red-500 mt-1">⚠️ {warnings.join(', ')}</p>
                    )}
                  </button>
                );
              })}
              {recipes.length === 0 && (
                <p className="text-center text-gray-500 py-8">No hay recetas disponibles</p>
              )}
            </div>
            <button onClick={() => { setShowPlanModal(false); setSelectedSlot(null); }} className="w-full mt-4 py-2 border rounded-lg">Cancelar</button>
          </div>
        </div>
      )}

      {showShoppingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Lista de compra semanal</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {shoppingList.map((item, idx) => (
                <div key={idx} className="flex justify-between p-2 bg-gray-50 rounded">
                  <span>{item.name}</span>
                  <span className="text-gray-500">{item.amount} {item.unit}</span>
                </div>
              ))}
              {shoppingList.length === 0 && (
                <p className="text-center text-gray-500 py-8">No hay ingredientes</p>
              )}
            </div>
            <button onClick={() => setShowShoppingModal(false)} className="w-full mt-4 py-2 border rounded-lg">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

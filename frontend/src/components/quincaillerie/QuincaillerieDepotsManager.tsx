import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
// removed icons and toast imports

interface Depot {
  id: string;
  name: string;
  address?: string;
  isMain: boolean;
}

export default function QuincaillerieDepotsManager() {
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showModal, setShowModal] = useState(false);
  const [editingDepot, setEditingDepot] = useState<Depot | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    isMain: false,
  });

  useEffect(() => {
    fetchDepots();
  }, []);

  const fetchDepots = async () => {
    try {
      setLoading(true);
      const data = await api.get('/quincaillerie/depots');
      setDepots(data);
    } catch (error: any) {
      alert('Erreur lors du chargement des dépôts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingDepot) {
        await api.put(`/quincaillerie/depots/${editingDepot.id}`, formData);
        alert('Dépôt mis à jour !');
      } else {
        await api.post('/quincaillerie/depots', formData);
        alert('Dépôt créé !');
      }
      setShowModal(false);
      fetchDepots();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Voulez-vous vraiment supprimer ce dépôt ?')) return;
    try {
      await api.delete(`/quincaillerie/depots/${id}`);
      alert('Dépôt supprimé !');
      fetchDepots();
    } catch (error: any) {
      alert('Impossible de supprimer ce dépôt s\'il contient du stock.');
    }
  };

  const openModal = (depot?: Depot) => {
    if (depot) {
      setEditingDepot(depot);
      setFormData({
        name: depot.name,
        address: depot.address || '',
        isMain: depot.isMain,
      });
    } else {
      setEditingDepot(null);
      setFormData({
        name: '',
        address: '',
        isMain: depots.length === 0, // le premier est principal par défaut
      });
    }
    setShowModal(true);
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500 animate-pulse">Chargement des dépôts...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gestion des Dépôts</h2>
          <p className="text-sm text-gray-500">Gérez vos différents lieux de stockage (Boutique, Entrepôt...)</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition flex items-center"
        >
          ➕ Nouveau Dépôt
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {depots.map((depot) => (
          <div key={depot.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 relative overflow-hidden">
            {depot.isMain && (
              <div className="absolute top-0 right-0 bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center">
                ⭐ Principal
              </div>
            )}
            <div className="flex items-start justify-between mb-4 mt-2">
              <div className="flex items-center">
                <div className="bg-indigo-100 p-3 rounded-lg mr-4">
                  🏢
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{depot.name}</h3>
                  {depot.address && <p className="text-sm text-gray-500">{depot.address}</p>}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => openModal(depot)}
                className="text-gray-500 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition"
              >
                ✏️
              </button>
              <button
                onClick={() => handleDelete(depot.id)}
                className="text-gray-500 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition"
                title="Supprimer"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}

        {depots.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-gray-300">
            <div className="mx-auto text-4xl mb-4">🏢</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun dépôt configuré</h3>
            <p className="text-gray-500 mb-4">Créez votre premier dépôt (ex: Boutique Principale) pour commencer.</p>
            <button
              onClick={() => openModal()}
              className="text-brand-600 font-medium hover:text-brand-700"
            >
              + Créer un dépôt
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {editingDepot ? 'Modifier le dépôt' : 'Nouveau dépôt'}
              </h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom du dépôt *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Ex: Boutique Centre-ville"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse (optionnel)</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder="Ex: 15 rue de la Paix"
                />
              </div>

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="isMain"
                  checked={formData.isMain}
                  onChange={(e) => setFormData({ ...formData, isMain: e.target.checked })}
                  className="h-4 w-4 text-brand-600 focus:ring-brand-500 border-gray-300 rounded"
                />
                <label htmlFor="isMain" className="ml-2 block text-sm text-gray-900">
                  Définir comme dépôt principal
                </label>
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

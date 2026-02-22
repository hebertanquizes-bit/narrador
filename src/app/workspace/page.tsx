'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, Trash2, BookOpen, Image, FileText, Wand2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Asset {
  _id: string;
  name: string;
  type: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
  description?: string;
  tags?: string[];
}

interface Workspace {
  _id: string;
  userId: string;
  name: string;
  assets: Asset[];
  createdAt: string;
}

const ASSET_TYPE_COLORS: { [key: string]: string } = {
  adventure: 'bg-purple-900/30 border-purple-500 text-purple-200',
  bestiary: 'bg-red-900/30 border-red-500 text-red-200',
  system: 'bg-blue-900/30 border-blue-500 text-blue-200',
  item: 'bg-yellow-900/30 border-yellow-500 text-yellow-200',
  npc: 'bg-green-900/30 border-green-500 text-green-200',
  map: 'bg-indigo-900/30 border-indigo-500 text-indigo-200',
};

const ASSET_TYPE_ICONS: { [key: string]: React.ReactNode } = {
  adventure: <BookOpen className="w-4 h-4" />,
  bestiary: <Wand2 className="w-4 h-4" />,
  system: <FileText className="w-4 h-4" />,
  item: <BookOpen className="w-4 h-4" />,
  npc: <Image className="w-4 h-4" />,
  map: <Image className="w-4 h-4" />,
};

export default function WorkspacePage() {
  const router = useRouter();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteAssetId, setDeleteAssetId] = useState<string | null>(null);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetType, setNewAssetType] = useState('adventure');
  const [newAssetDesc, setNewAssetDesc] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { user, isNarrator, isPlayer, loading: authLoading } = useAuth();

  // Fetch workspace and assets on mount
  useEffect(() => {
    // Wait for auth context to be fully loaded
    if (authLoading) return;

    if (!user) {
      router.push('/');
      return;
    }

    // Role Guard inside Workspace
    if (!user.role) {
      router.push('/workspace/selecionar');
      return;
    }

    // TODO: This uses old localStorage logic that we will migrate to Supabase in the next steps!
    const workspaceKey = `narrador_workspace_${user.id}`;

    // Load workspace from localStorage
    const savedWorkspace = localStorage.getItem(workspaceKey);
    if (savedWorkspace) {
      try {
        const ws = JSON.parse(savedWorkspace);
        setWorkspace(ws);
        setAssets(ws.assets || []);
      } catch (e) {
        console.error('Erro ao carregar workspace:', e);
        initWorkspace(user.id);
      }
    } else {
      initWorkspace(user.id);
    }

    // Sincronizar com localStorage a cada 500ms
    const syncInterval = setInterval(() => {
      const latest = localStorage.getItem(workspaceKey);
      if (latest) {
        try {
          const ws = JSON.parse(latest);
          setWorkspace(ws);
          setAssets(ws.assets || []);
        } catch (e) {
          console.error('Erro ao sincronizar workspace:', e);
        }
      }
    }, 500);

    return () => clearInterval(syncInterval);
  }, [router, user, authLoading]);

  const initWorkspace = (userId: string) => {
    const user = JSON.parse(localStorage.getItem('narrador_user') || '{}');
    const workspaceKey = `narrador_workspace_${userId}`;
    const newWorkspace: Workspace = {
      _id: 'local_' + Date.now(),
      userId: userId,
      name: `Workspace - ${user.name || 'Novo'}`,
      assets: [],
      createdAt: new Date().toISOString(),
    };
    setWorkspace(newWorkspace);
    setAssets([]);
    localStorage.setItem(workspaceKey, JSON.stringify(newWorkspace));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (100MB max)
      if (file.size > 100 * 1024 * 1024) {
        setError('Arquivo muito grande (máximo 100MB)');
        return;
      }

      // Validate MIME type
      const allowedMimes = [
        'application/pdf',
        'image/png',
        'image/jpeg',
        'image/webp',
        'text/plain',
        'text/markdown',
        'application/json',
      ];

      if (!allowedMimes.includes(file.type)) {
        setError('Tipo de arquivo não suportado');
        return;
      }

      // Auto-fill name from filename (remove extension)
      const fileName = file.name.split('.').slice(0, -1).join('.');
      setNewAssetName(fileName);
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !newAssetName || !newAssetType) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setUploading(true);
      setError(null);

      // Create a FileReader to convert file to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const fileContent = e.target?.result as string;

        // Create new asset object
        const newAsset: Asset = {
          _id: 'asset_' + Date.now(),
          name: newAssetName,
          type: newAssetType,
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          uploadedAt: new Date().toISOString(),
          description: newAssetDesc,
          tags: [],
        };

        // Update assets and workspace
        const updatedAssets = [newAsset, ...assets];
        setAssets(updatedAssets);

        // Save to localStorage
        if (workspace) {
          const updatedWorkspace = {
            ...workspace,
            assets: updatedAssets,
          };
          setWorkspace(updatedWorkspace);
          const user = JSON.parse(localStorage.getItem('narrador_user') || '{}');
          const workspaceKey = `narrador_workspace_${user.id}`;
          localStorage.setItem(workspaceKey, JSON.stringify(updatedWorkspace));
        }

        // Clear form
        setShowUploadModal(false);
        setNewAssetName('');
        setNewAssetType('adventure');
        setNewAssetDesc('');
        setSelectedFile(null);
        setUploading(false);
      };

      reader.onerror = () => {
        setError('Erro ao ler arquivo');
        setUploading(false);
      };

      reader.readAsDataURL(selectedFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao enviar arquivo');
      setUploading(false);
    }
  };

  const handleDeleteAsset = (assetId: string) => {
    console.log('Abrindo modal de delete para asset:', assetId);
    setDeleteAssetId(assetId);
    setShowDeleteModal(true);
  };

  const confirmDeleteAsset = () => {
    if (!deleteAssetId) return;

    console.log('Confirmando delete de asset:', deleteAssetId);

    try {
      console.log('Assets antes:', assets);

      // Remove from assets array
      const updatedAssets = assets.filter(a => a._id !== deleteAssetId);
      console.log('Assets depois do filtro:', updatedAssets);

      // Update state FIRST
      setAssets(updatedAssets);

      // Update workspace
      if (workspace) {
        const updatedWorkspace = {
          ...workspace,
          assets: updatedAssets,
        };
        console.log('Salvando workspace:', updatedWorkspace);
        setWorkspace(updatedWorkspace);

        // Get user ID for proper key
        const user = JSON.parse(localStorage.getItem('narrador_user') || '{}');
        const workspaceKey = `narrador_workspace_${user.id}`;

        // Save IMMEDIATELY to localStorage
        const serialized = JSON.stringify(updatedWorkspace);
        localStorage.setItem(workspaceKey, serialized);
        console.log('Workspace salvo no localStorage:', workspaceKey);

        // Verify it was saved
        const saved = localStorage.getItem(workspaceKey);
        console.log('Verificando localStorage:', JSON.parse(saved || '{}'));
      }

      setError(null);
      setShowDeleteModal(false);
      setDeleteAssetId(null);
    } catch (err) {
      console.error('Erro ao deletar:', err);
      setError(err instanceof Error ? err.message : 'Erro ao deletar asset');
    }
  };

  const cancelDeleteAsset = () => {
    setShowDeleteModal(false);
    setDeleteAssetId(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-rpg-dark flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <Wand2 className="w-8 h-8 text-rpg-gold mx-auto" />
          </div>
          <p className="text-rpg-light">Carregando workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rpg-dark">
      {/* Header */}
      <div className="bg-rpg-darker border-b border-rpg-gold/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <button
                className="p-2 hover:bg-rpg-gold/10 rounded transition-colors"
                title="Voltar"
                aria-label="Voltar"
              >
                <ArrowLeft className="w-5 h-5 text-rpg-gold" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-rpg-light">
                {workspace?.name || 'Meu Workspace'}
              </h1>
              <p className="text-rpg-light/60 text-sm">
                {assets.length} assets na biblioteca
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Papel atual + botão Trocar — único local onde isso é permitido */}
            <div className="flex items-center gap-2">
              <span className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-full border font-medium ${isNarrator
                  ? 'border-purple-500/50 bg-purple-900/20 text-purple-300'
                  : 'border-blue-500/50 bg-blue-900/20 text-blue-300'
                }`}>
                <Wand2 className="w-3 h-3" />
                {isNarrator ? 'Narrador' : 'Jogador'}
              </span>
              <Link
                href="/workspace/selecionar"
                className="text-xs px-3 py-1.5 rounded-full border border-rpg-border text-rpg-muted hover:text-white hover:border-rpg-gold transition"
              >
                Trocar Papel
              </Link>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 bg-rpg-gold text-rpg-darker px-4 py-2 rounded font-bold hover:bg-rpg-gold/80 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Enviar Asset
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="max-w-7xl mx-auto mt-4 p-4 bg-red-900/20 border border-red-500 rounded text-red-200">
          {error}
        </div>
      )}

      {/* Assets Grid */}
      <div className="max-w-7xl mx-auto p-6">
        {assets.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-rpg-gold/40 mx-auto mb-4" />
            <p className="text-rpg-light/60 mb-4">Nenhum asset na biblioteca ainda</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 bg-rpg-gold text-rpg-darker px-6 py-3 rounded font-bold hover:bg-rpg-gold/80 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Enviar Primeiro Asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.map(asset => (
              <div
                key={asset._id}
                className={`p-4 rounded border ${ASSET_TYPE_COLORS[asset.type] || 'bg-rpg-darker border-rpg-light/20'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {ASSET_TYPE_ICONS[asset.type] || <FileText className="w-4 h-4" />}
                    <span className="text-xs font-bold uppercase">
                      {asset.type}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAsset(asset._id)}
                    className="p-1 hover:bg-red-500/20 rounded transition-colors text-red-400 hover:text-red-300"
                    title="Excluir"
                    aria-label="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-rpg-light mb-1">{asset.name}</h3>
                {asset.description && (
                  <p className="text-sm text-rpg-light/70 mb-3">{asset.description}</p>
                )}

                {asset.tags && asset.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {asset.tags.map(tag => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-black/30 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="text-xs text-rpg-light/50 space-y-1">
                  <p>📄 {asset.fileName}</p>
                  <p>💾 {(asset.fileSize / 1024 / 1024).toFixed(2)} MB</p>
                  <p>📅 {new Date(asset.uploadedAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-rpg-darker border-2 border-rpg-gold rounded-lg max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-rpg-light mb-6">Enviar Novo Asset</h2>

            <div className="space-y-4">
              {/* File Upload Area */}
              <div>
                <label className="block text-rpg-light font-bold mb-2">
                  Arquivo (obrigatório)
                </label>
                <label className="block border-2 border-dashed border-rpg-gold/40 rounded p-8 text-center cursor-pointer hover:border-rpg-gold/60 transition-colors">
                  <Upload className="w-8 h-8 text-rpg-gold/60 mx-auto mb-2" />
                  <p className="text-rpg-light/70">
                    {selectedFile ? selectedFile.name : 'Clique ou arraste um arquivo aqui'}
                  </p>
                  <p className="text-sm text-rpg-light/50 mt-1">
                    PDF, imagens, documentos (máx 100MB)
                  </p>
                  <input
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,.md,.json"
                  />
                </label>
              </div>

              {/* Asset Name */}
              <div>
                <label className="block text-rpg-light font-bold mb-2">
                  Nome do Asset *
                </label>
                <input
                  type="text"
                  value={newAssetName}
                  onChange={e => setNewAssetName(e.target.value)}
                  placeholder="Ex: Campanha - Caverna Perdida"
                  className="w-full bg-rpg-dark border border-rpg-light/20 rounded px-3 py-2 text-rpg-light placeholder:text-rpg-light/40 focus:outline-none focus:border-rpg-gold"
                />
              </div>

              {/* Asset Type */}
              <div>
                <label className="block text-rpg-light font-bold mb-2">
                  Tipo de Asset *
                </label>
                <select
                  value={newAssetType}
                  onChange={e => setNewAssetType(e.target.value)}
                  className="w-full bg-rpg-dark border border-rpg-light/20 rounded px-3 py-2 text-rpg-light focus:outline-none focus:border-rpg-gold"
                  title="Tipo de Asset"
                  aria-label="Tipo de Asset"
                >
                  <option value="adventure">Aventura</option>
                  <option value="bestiary">Bestiário</option>
                  <option value="system">Sistema / Regras</option>
                  <option value="item">Item / Magia</option>
                  <option value="npc">PNJ</option>
                  <option value="map">Mapa</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-rpg-light font-bold mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={newAssetDesc}
                  onChange={e => setNewAssetDesc(e.target.value)}
                  placeholder="Descreva este asset..."
                  rows={3}
                  className="w-full bg-rpg-dark border border-rpg-light/20 rounded px-3 py-2 text-rpg-light placeholder:text-rpg-light/40 focus:outline-none focus:border-rpg-gold resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    setNewAssetName('');
                    setNewAssetType('adventure');
                    setNewAssetDesc('');
                    setSelectedFile(null);
                  }}
                  disabled={uploading}
                  className="flex-1 px-4 py-2 bg-rpg-light/10 text-rpg-light rounded hover:bg-rpg-light/20 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpload}
                  disabled={uploading || !selectedFile || !newAssetName}
                  className="flex-1 px-4 py-2 bg-rpg-gold text-rpg-darker font-bold rounded hover:bg-rpg-gold/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Enviando...' : 'Enviar Asset'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-rpg-darker border-2 border-red-500 rounded-lg max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4">Confirmar Exclusão</h2>
            <p className="text-rpg-light mb-6">
              Tem certeza que deseja deletar este asset? Esta ação não pode ser desfeita.
            </p>

            <div className="flex gap-3">
              <button
                onClick={cancelDeleteAsset}
                className="flex-1 px-4 py-2 bg-rpg-light/10 text-rpg-light rounded hover:bg-rpg-light/20 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteAsset}
                className="flex-1 px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors"
              >
                Deletar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

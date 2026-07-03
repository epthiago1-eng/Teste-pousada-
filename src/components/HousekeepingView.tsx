import React, { useState } from 'react';
import { Room, RoomStatus } from '../types';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  RefreshCw, 
  ChevronRight,
  Search,
  Filter,
  ArrowLeft,
  ShieldCheck,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface HousekeepingViewProps {
  rooms: Room[];
  onUpdateRoomStatus: (roomId: string, status: RoomStatus) => void;
  onBack?: () => void;
}

export const HousekeepingView: React.FC<HousekeepingViewProps> = ({ 
  rooms, 
  onUpdateRoomStatus,
  onBack 
}) => {
  const [filter, setFilter] = useState<RoomStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);

  const filteredRooms = rooms.filter(room => {
    const matchesFilter = filter === 'all' || room.status === filter;
    const matchesSearch = room.number.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const stats = {
    dirty: rooms.filter(r => r.status === 'dirty').length,
    cleaning: rooms.filter(r => r.status === 'cleaning').length,
    clean: rooms.filter(r => r.status === 'clean').length,
    inspected: rooms.filter(r => r.status === 'inspected').length,
  };

  const getStatusIcon = (status: RoomStatus) => {
    switch (status) {
      case 'clean': return <CheckCircle2 className="text-emerald-500" size={20} />;
      case 'dirty': return <AlertCircle className="text-rose-500" size={20} />;
      case 'cleaning': return <RefreshCw className="text-blue-500 animate-spin" size={20} />;
      case 'inspected': return <ShieldCheck className="text-indigo-500" size={20} />;
      case 'maintenance': return <Wrench className="text-amber-500" size={20} />;
      default: return <Clock className="text-slate-400" size={20} />;
    }
  };

  const getStatusLabel = (status: RoomStatus) => {
    switch (status) {
      case 'clean': return 'Limpo';
      case 'dirty': return 'Sujo';
      case 'cleaning': return 'Limpando';
      case 'inspected': return 'Inspecionado';
      case 'maintenance': return 'Manutenção';
      default: return status;
    }
  };

  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 pb-8 rounded-b-[2rem] shadow-xl relative z-30">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft size={24} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Painel de Limpeza</h1>
              <p className="text-slate-400 text-sm font-medium mt-1">Gestão de Governança</p>
            </div>
          </div>
          <div className="bg-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
            <span className="text-xl font-bold">{rooms.length}</span>
            <span className="text-xs font-medium text-slate-300 uppercase tracking-widest">Qts</span>
          </div>
        </div>

        {/* Stats Flex/Scroll */}
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x hide-scrollbar -mx-2 px-2">
          <button 
            onClick={() => setFilter('dirty')}
            className={cn(
              "flex-shrink-0 w-[100px] snap-center p-4 rounded-3xl transition-all border-2",
              filter === 'dirty' ? "bg-rose-500 border-rose-400 text-white shadow-lg shadow-rose-500/30" : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800"
            )}
          >
            <div className="text-2xl font-bold mb-1">{stats.dirty}</div>
            <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">Sujos</div>
          </button>
          
          <button 
            onClick={() => setFilter('cleaning')}
            className={cn(
              "flex-shrink-0 w-[100px] snap-center p-4 rounded-3xl transition-all border-2",
              filter === 'cleaning' ? "bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/30" : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800"
            )}
          >
            <div className="text-2xl font-bold mb-1">{stats.cleaning}</div>
            <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">Andamento</div>
          </button>

          <button 
            onClick={() => setFilter('clean')}
            className={cn(
               "flex-shrink-0 w-[100px] snap-center p-4 rounded-3xl transition-all border-2",
               filter === 'clean' ? "bg-emerald-500 border-emerald-400 text-white shadow-lg shadow-emerald-500/30" : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800"
            )}
          >
            <div className="text-2xl font-bold mb-1">{stats.clean}</div>
            <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">Limpos</div>
          </button>

          <button 
            onClick={() => setFilter('inspected')}
            className={cn(
               "flex-shrink-0 w-[100px] snap-center p-4 rounded-3xl transition-all border-2",
               filter === 'inspected' ? "bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/30" : "bg-slate-800/50 border-slate-700/50 text-slate-300 hover:bg-slate-800"
            )}
          >
            <div className="text-2xl font-bold mb-1">{stats.inspected}</div>
            <div className="text-[10px] uppercase font-bold tracking-widest opacity-80">Prontos</div>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="px-6 py-4 relative z-20 -mt-6">
        <div className="relative shadow-xl shadow-slate-200/50 rounded-2xl">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por número..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white border-0 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium placeholder:font-normal"
          />
        </div>
      </div>

      {/* Room List */}
      <div className="p-4 space-y-3">
        {filteredRooms.length > 0 ? (
          filteredRooms.map(room => (
            <motion.div 
              layout
              key={room.id}
              onClick={() => setSelectedRoomId(room.id)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold",
                  room.status === 'dirty' ? "bg-rose-50 text-rose-600" :
                  room.status === 'cleaning' ? "bg-blue-50 text-blue-600" :
                  room.status === 'clean' ? "bg-emerald-50 text-emerald-600" :
                  room.status === 'inspected' ? "bg-indigo-50 text-indigo-600" :
                  "bg-slate-50 text-slate-600"
                )}>
                  {room.number}
                </div>
                <div>
                  <div className="font-bold text-slate-800">{room.category}</div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                    {room.availability === 'occupied' ? (
                      <span className="text-rose-500 font-bold">OCUPADO</span>
                    ) : (
                      <span className="text-emerald-500 font-bold">VAGO</span>
                    )}
                    <span>•</span>
                    <span>{getStatusLabel(room.status)}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(room.status)}
                <ChevronRight className="text-slate-300" size={20} />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-slate-400 italic">
            Nenhum quarto encontrado com este filtro.
          </div>
        )}
      </div>

      {/* Room Detail Modal / Sheet */}
      <AnimatePresence>
        {selectedRoomId && selectedRoom && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRoomId(null)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40"
            />
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[32px] p-8 z-50 shadow-2xl max-h-[80vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
              
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-slate-800">Quarto {selectedRoom.number}</h2>
                  <p className="text-slate-500 font-medium">{selectedRoom.category}</p>
                </div>
                <div className={cn(
                  "px-4 py-2 rounded-2xl font-bold text-sm",
                  selectedRoom.availability === 'occupied' ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {selectedRoom.availability === 'occupied' ? 'OCUPADO' : 'VAGO'}
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Atualizar Status</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  <button 
                    onClick={() => {
                      onUpdateRoomStatus(selectedRoom.id, 'cleaning');
                      setSelectedRoomId(null);
                    }}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border-2 transition-all",
                      selectedRoom.status === 'cleaning' ? "border-blue-500 bg-blue-50" : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                        <RefreshCw size={24} className={selectedRoom.status === 'cleaning' ? 'animate-spin' : ''} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-800">Iniciar Limpeza</div>
                        <div className="text-xs text-slate-500">Marcar como em andamento</div>
                      </div>
                    </div>
                    {selectedRoom.status === 'cleaning' && <CheckCircle2 className="text-blue-500" size={24} />}
                  </button>

                  <button 
                    onClick={() => {
                      onUpdateRoomStatus(selectedRoom.id, 'clean');
                      setSelectedRoomId(null);
                    }}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border-2 transition-all",
                      selectedRoom.status === 'clean' ? "border-emerald-500 bg-emerald-50" : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center">
                        <CheckCircle2 size={24} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-800">Finalizar Limpeza</div>
                        <div className="text-xs text-slate-500">Marcar como limpo</div>
                      </div>
                    </div>
                    {selectedRoom.status === 'clean' && <CheckCircle2 className="text-emerald-500" size={24} />}
                  </button>

                  <button 
                    onClick={() => {
                      onUpdateRoomStatus(selectedRoom.id, 'inspected');
                      setSelectedRoomId(null);
                    }}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border-2 transition-all",
                      selectedRoom.status === 'inspected' ? "border-indigo-500 bg-indigo-50" : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center">
                        <ShieldCheck size={24} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-800">Inspecionar</div>
                        <div className="text-xs text-slate-500">Aprovar para liberação</div>
                      </div>
                    </div>
                    {selectedRoom.status === 'inspected' && <CheckCircle2 className="text-indigo-500" size={24} />}
                  </button>

                  <button 
                    onClick={() => {
                      onUpdateRoomStatus(selectedRoom.id, 'dirty');
                      setSelectedRoomId(null);
                    }}
                    className={cn(
                      "flex items-center justify-between p-5 rounded-2xl border-2 transition-all",
                      selectedRoom.status === 'dirty' ? "border-rose-500 bg-rose-50" : "border-slate-100 bg-white hover:border-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center">
                        <AlertCircle size={24} />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-slate-800">Marcar como Sujo</div>
                        <div className="text-xs text-slate-500">Necessita de limpeza</div>
                      </div>
                    </div>
                    {selectedRoom.status === 'dirty' && <CheckCircle2 className="text-rose-500" size={24} />}
                  </button>
                </div>

                <button 
                  onClick={() => setSelectedRoomId(null)}
                  className="w-full py-4 text-slate-500 font-bold hover:text-slate-800 transition-colors"
                >
                  Fechar
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick Switcher (Demo Only) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur shadow-xl border border-slate-200 rounded-full px-6 py-3 flex items-center gap-4 z-30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-xs font-bold text-slate-600">ONLINE</span>
        </div>
        <div className="h-4 w-px bg-slate-200" />
        <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Camareira: Maria</span>
      </div>
    </div>
  );
};

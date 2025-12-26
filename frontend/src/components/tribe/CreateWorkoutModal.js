import React, { useState } from 'react';
import { X, Dumbbell, Clock, Flame, Target, Plus, Trash2 } from 'lucide-react';
import axios from 'axios';
import { API } from '../../App';
import { toast } from 'sonner';

const CreateWorkoutModal = ({ tribeId, currentUser, onClose, onCreated }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '30',
    difficulty: 'intermediate',
    targetMuscles: [],
    exercises: [{ name: '', sets: '', reps: '', duration: '' }],
    equipment: [],
    calories: ''
  });

  const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'];
  const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Core', 'Glutes', 'Full Body', 'Cardio'];
  const equipmentList = ['None', 'Dumbbells', 'Barbell', 'Resistance Bands', 'Kettlebell', 'Pull-up Bar', 'Bench', 'Machine'];

  const addExercise = () => {
    setFormData(prev => ({
      ...prev,
      exercises: [...prev.exercises, { name: '', sets: '', reps: '', duration: '' }]
    }));
  };

  const updateExercise = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => i === index ? { ...ex, [field]: value } : ex)
    }));
  };

  const removeExercise = (index) => {
    if (formData.exercises.length > 1) {
      setFormData(prev => ({
        ...prev,
        exercises: prev.exercises.filter((_, i) => i !== index)
      }));
    }
  };

  const toggleItem = (field, item) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Please enter a workout title');
      return;
    }

    setLoading(true);
    try {
      const workoutData = {
        ...formData,
        tribeId,
        authorId: currentUser.id,
        exercises: formData.exercises.filter(ex => ex.name.trim()),
        duration: parseInt(formData.duration) || 30,
        calories: parseInt(formData.calories) || null
      };

      await axios.post(`${API}/workouts?userId=${currentUser.id}`, workoutData);
      toast.success('Workout added! 💪');
      onCreated?.();
      onClose();
    } catch (error) {
      toast.error('Failed to add workout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#1a0b2e] rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center">
              <Dumbbell size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Add Workout</h2>
              <p className="text-xs text-gray-400">Share your fitness routine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-full">
            <X size={24} className="text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Workout Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="e.g., Full Body HIIT"
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the workout..."
              rows={2}
              className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>

          {/* Duration & Difficulty */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Duration (mins)</label>
              <div className="relative">
                <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Est. Calories</label>
              <div className="relative">
                <Flame size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="number"
                  value={formData.calories}
                  onChange={(e) => setFormData(prev => ({ ...prev, calories: e.target.value }))}
                  placeholder="200"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label>
            <div className="flex gap-2">
              {difficulties.map(diff => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, difficulty: diff }))}
                  className={`flex-1 py-2 rounded-lg text-sm capitalize transition ${formData.difficulty === diff ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Target Muscles */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Target Muscles</label>
            <div className="flex flex-wrap gap-2">
              {muscleGroups.map(muscle => (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => toggleItem('targetMuscles', muscle)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${formData.targetMuscles.includes(muscle) ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  {muscle}
                </button>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Equipment Needed</label>
            <div className="flex flex-wrap gap-2">
              {equipmentList.map(eq => (
                <button
                  key={eq}
                  type="button"
                  onClick={() => toggleItem('equipment', eq)}
                  className={`px-3 py-1.5 rounded-full text-sm transition ${formData.equipment.includes(eq) ? 'bg-purple-500 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                >
                  {eq}
                </button>
              ))}
            </div>
          </div>

          {/* Exercises */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Exercises</label>
            <div className="space-y-2">
              {formData.exercises.map((exercise, index) => (
                <div key={index} className="flex gap-2 items-start">
                  <div className="flex-1 grid grid-cols-4 gap-2">
                    <input
                      type="text"
                      value={exercise.name}
                      onChange={(e) => updateExercise(index, 'name', e.target.value)}
                      placeholder="Exercise name"
                      className="col-span-2 px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="text"
                      value={exercise.sets}
                      onChange={(e) => updateExercise(index, 'sets', e.target.value)}
                      placeholder="Sets"
                      className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
                    />
                    <input
                      type="text"
                      value={exercise.reps}
                      onChange={(e) => updateExercise(index, 'reps', e.target.value)}
                      placeholder="Reps"
                      className="px-3 py-2 bg-gray-800/50 border border-gray-700 rounded-lg text-white text-sm placeholder:text-gray-500 focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  {formData.exercises.length > 1 && (
                    <button type="button" onClick={() => removeExercise(index)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addExercise} className="flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300">
                <Plus size={16} /> Add exercise
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-xl disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Workout'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateWorkoutModal;

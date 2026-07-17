import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { SegmentedControl } from '@/components/segmented-control';
import type { Category, CategoryGroup } from '@/domain/types';
import { useColors } from '@/hooks/use-colors';
import { useLedger } from '@/providers/ledger-provider';

const DIRECTION_OPTIONS: { value: Category['direction']; label: string }[] = [
  { value: 'expense', label: 'Pengeluaran' },
  { value: 'income', label: 'Pemasukan' },
];

function CategoryRow({
  category,
  indent,
  editing,
  onPress,
  onChangeEditName,
  onRename,
  onToggleActive,
  onDelete,
  canDelete,
}: {
  category: Category;
  indent: boolean;
  editing: { name: string } | null;
  onPress: () => void;
  onChangeEditName: (name: string) => void;
  onRename: (category: Category) => void;
  onToggleActive: (category: Category) => void;
  onDelete: (category: Category) => void;
  canDelete: boolean;
}) {
  return (
    <View className={indent ? 'ml-6' : ''}>
      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between border-b border-fill bg-card px-3 py-3">
        <View className="flex-row items-center gap-2">
          <Text className="text-ink">{category.name}</Text>
          {!category.active && <Text className="rounded-full bg-fill px-2 py-0.5 text-xs text-muted">nonaktif</Text>}
        </View>
        <Text className="text-muted">{editing ? '▾' : '▸'}</Text>
      </Pressable>

      {editing && (
        <View className="gap-2 border-b border-fill bg-fill px-3 py-3">
          <TextInput
            value={editing.name}
            onChangeText={onChangeEditName}
            className="rounded-lg border-3 border-line bg-card px-3 py-2 text-ink"
          />
          <View className="flex-row gap-2">
            <Pressable onPress={() => onRename(category)} className="flex-1 items-center rounded-lg bg-frame py-2">
              <Text className="font-bold text-card">Simpan nama</Text>
            </Pressable>
            <Pressable
              onPress={() => onToggleActive(category)}
              className="flex-1 items-center rounded-lg border-3 border-line py-2">
              <Text className="font-bold text-ink">{category.active ? 'Nonaktifkan' : 'Aktifkan'}</Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => onDelete(category)}
            disabled={!canDelete}
            className={`items-center rounded-lg border-3 py-2 ${canDelete ? 'border-line' : 'border-fill-2'}`}>
            <Text className={`font-bold ${canDelete ? 'text-muted' : 'text-fill-2'}`}>
              {canDelete ? 'Hapus' : 'Tidak bisa dihapus — sudah dipakai'}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function ManageCategoryScreen() {
  const params = useLocalSearchParams<{ direction?: string }>();
  const ledger = useLedger();
  const colors = useColors();

  const [direction, setDirection] = useState<Category['direction']>(
    params.direction === 'income' ? 'income' : 'expense',
  );
  const [tree, setTree] = useState<CategoryGroup[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [canDeleteEditing, setCanDeleteEditing] = useState(false);
  const [addingUnder, setAddingUnder] = useState<string | 'top' | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');

  const load = useCallback(() => {
    let cancelled = false;
    ledger.listCategoryTree(direction, { includeInactive: true }).then((loaded) => {
      if (!cancelled) setTree(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, [ledger, direction]);

  useFocusEffect(load);

  function startEditing(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setAddingUnder(null);
    ledger.isCategoryInUse(category.id).then((inUse) => setCanDeleteEditing(!inUse));
  }

  async function rename(category: Category) {
    if (!editName.trim()) return;
    await ledger.renameCategory(category.id, editName.trim());
    setEditingId(null);
    load();
  }

  async function toggleActive(category: Category) {
    await ledger.setCategoryActive(category.id, !category.active);
    setEditingId(null);
    load();
  }

  async function remove(category: Category) {
    if (!canDeleteEditing) return;
    await ledger.deleteCategory(category.id);
    setEditingId(null);
    load();
  }

  async function addCategory() {
    if (!newCategoryName.trim() || addingUnder === null) return;
    await ledger.addCategory({
      name: newCategoryName.trim(),
      direction,
      parentId: addingUnder === 'top' ? null : addingUnder,
    });
    setNewCategoryName('');
    setAddingUnder(null);
    load();
  }

  return (
    <SafeAreaView className="flex-1 bg-paper">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Pressable onPress={() => router.back()}>
          <Text className="text-muted">Tutup</Text>
        </Pressable>
        <Text className="font-bold text-ink">Kelola Kategori</Text>
        <View className="w-10" />
      </View>

      <SegmentedControl
        options={DIRECTION_OPTIONS}
        value={direction}
        onChange={(value) => {
          setDirection(value);
          setEditingId(null);
          setAddingUnder(null);
        }}
        className="mx-4"
      />

      <ScrollView className="flex-1 px-4 pt-3">
        {tree.map((group) => (
          <View key={group.parent.id} className="mb-3 overflow-hidden rounded-xl border-3 border-frame">
            <CategoryRow
              category={group.parent}
              indent={false}
              editing={editingId === group.parent.id ? { name: editName } : null}
              onPress={() => (editingId === group.parent.id ? setEditingId(null) : startEditing(group.parent))}
              onChangeEditName={setEditName}
              onRename={rename}
              onToggleActive={toggleActive}
              onDelete={remove}
              canDelete={canDeleteEditing}
            />
            {group.children.map((child) => (
              <CategoryRow
                key={child.id}
                category={child}
                indent
                editing={editingId === child.id ? { name: editName } : null}
                onPress={() => (editingId === child.id ? setEditingId(null) : startEditing(child))}
                onChangeEditName={setEditName}
                onRename={rename}
                onToggleActive={toggleActive}
                onDelete={remove}
                canDelete={canDeleteEditing}
              />
            ))}

            {addingUnder === group.parent.id ? (
              <View className="ml-6 gap-2 bg-fill px-3 py-3">
                <TextInput
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  placeholder="Nama subkategori"
                  placeholderTextColor={colors.muted}
                  className="rounded-lg border-3 border-line bg-card px-3 py-2 text-ink"
                />
                <Pressable onPress={addCategory} className="items-center rounded-lg bg-frame py-2">
                  <Text className="font-bold text-card">Tambah subkategori</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={() => {
                  setAddingUnder(group.parent.id);
                  setNewCategoryName('');
                  setEditingId(null);
                }}
                className="ml-6 items-center border-t border-fill bg-card py-2">
                <Text className="text-xs text-muted">+ Tambah subkategori</Text>
              </Pressable>
            )}
          </View>
        ))}

        {addingUnder === 'top' ? (
          <View className="mb-4 gap-2 rounded-xl border-3 border-dashed border-line px-3 py-3">
            <TextInput
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="Nama kategori"
              placeholderTextColor={colors.muted}
              className="rounded-lg border-3 border-line bg-card px-3 py-2 text-ink"
            />
            <Pressable onPress={addCategory} className="items-center rounded-lg bg-frame py-2">
              <Text className="font-bold text-card">Tambah kategori</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => {
              setAddingUnder('top');
              setNewCategoryName('');
              setEditingId(null);
            }}
            className="mb-4 items-center rounded-xl border-3 border-dashed border-line py-3">
            <Text className="font-bold text-muted">+ Tambah Kategori</Text>
          </Pressable>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

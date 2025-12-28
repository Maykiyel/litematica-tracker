import React, { useState, useEffect } from "react";
import {
  Upload,
  Download,
  CheckCircle,
  Package,
  TrendingUp,
  Search,
  Trash2,
  Plus,
  Minus,
  RotateCcw,
  Printer,
  X,
} from "lucide-react";
import Papa from "papaparse";

const LitematicaTracker = () => {
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [filter, setFilter] = useState("all");
  const [showShoppingList, setShowShoppingList] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("litematica_items");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load saved data:", e);
      }
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem("litematica_items", JSON.stringify(items));
    }
  }, [items]);

  // Convert Litematica item names to Minecraft texture names
  const getMinecraftTextureName = (itemName) => {
    // Clean up the name: lowercase, replace spaces with underscores
    let name = itemName.toLowerCase().replace(/\s+/g, "_").replace(/[()]/g, "");

    // Handle common variations and mappings
    const mappings = {
      smooth_stone_slab: "smooth_stone_slab",
      stone_brick: "stone_bricks",
      stonebrick: "stone_bricks",
      wood_plank: "oak_planks",
      wooden_plank: "oak_planks",
      glass_pane: "glass_pane",
      iron_bar: "iron_bars",
      nether_brick: "nether_bricks",
      red_nether_brick: "red_nether_bricks",
    };

    return mappings[name] || name;
  };

  // Get Minecraft block icon URL
  const getBlockIconUrl = (itemName) => {
    const textureName = getMinecraftTextureName(itemName);
    // Using Minecraft Wiki API for block/item textures
    return `https://minecraft.wiki/images/Invicon_${textureName
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("_")}.png`;
  };

  // Fallback color if image fails to load
  const getItemColor = (name) => {
    const n = name.toLowerCase();
    if (
      n.includes("stone") ||
      n.includes("cobble") ||
      n.includes("andesite") ||
      n.includes("granite")
    )
      return "#7f7f7f";
    if (n.includes("oak") || n.includes("spruce") || n.includes("birch"))
      return "#8b6f47";
    if (n.includes("dark_oak") || n.includes("dark oak")) return "#4a3728";
    if (n.includes("acacia")) return "#ba5d3b";
    if (n.includes("jungle")) return "#b1805c";
    if (n.includes("glass")) return "#c0e8f0";
    if (n.includes("sand")) return "#e9d5b3";
    if (n.includes("brick")) return "#8e4a3d";
    if (n.includes("wool") || n.includes("carpet")) return "#e9ecef";
    if (n.includes("concrete")) return "#6c757d";
    if (n.includes("terracotta")) return "#a85b3d";
    if (n.includes("iron")) return "#d8d8d8";
    if (n.includes("gold")) return "#fcee4d";
    if (n.includes("diamond")) return "#5dd9d9";
    if (n.includes("emerald")) return "#17dd62";
    if (n.includes("redstone")) return "#ff0000";
    if (n.includes("lapis")) return "#2450a3";
    if (n.includes("coal")) return "#353535";
    if (n.includes("quartz")) return "#e6ddd2";
    if (n.includes("prismarine")) return "#5b9a9f";
    if (n.includes("obsidian")) return "#100819";
    if (n.includes("netherrack")) return "#6b3636";
    if (n.includes("leaves") || n.includes("grass")) return "#5c9e3c";
    if (n.includes("dirt") || n.includes("gravel")) return "#876652";
    return "#8b8b8b";
  };

  const formatStacks = (amount) => {
    const stacks = Math.floor(amount / 64);
    const extra = amount % 64;
    if (extra > 0) {
      return `${stacks}s ${extra}i`;
    }
    return `${stacks}s`;
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      complete: (results) => {
        const parsedItems = results.data
          .map((row, idx) => {
            const name = (row.Item || row.item || "Unknown").toString().trim();
            const total = parseInt(row.Total || row.total || 0);
            const available = parseInt(row.Available || row.available || 0);

            return {
              id: `item-${idx}-${Date.now()}`,
              name: name,
              total: total,
              available: available,
            };
          })
          .filter((item) => item.total > 0);

        setItems(parsedItems);
      },
      error: (error) => {
        alert(`Error parsing CSV: ${error.message}`);
      },
    });

    e.target.value = "";
  };

  const updateAvailable = (id, value) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const newAvailable = Math.max(
            0,
            Math.min(parseInt(value) || 0, item.total)
          );
          return { ...item, available: newAvailable };
        }
        return item;
      })
    );
  };

  const updateAvailableStacks = (id, stacks) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const partial = item.available % 64;
          const newAvailable = Math.max(
            0,
            Math.min(stacks * 64 + partial, item.total)
          );
          return { ...item, available: newAvailable };
        }
        return item;
      })
    );
  };

  const quickAdd = (id, amount) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const newAvailable = Math.min(item.available + amount, item.total);
          return { ...item, available: newAvailable };
        }
        return item;
      })
    );
  };

  const quickSubtract = (id, amount) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          const newAvailable = Math.max(item.available - amount, 0);
          return { ...item, available: newAvailable };
        }
        return item;
      })
    );
  };

  const markComplete = (id) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, available: item.total } : item
      )
    );
  };

  const resetItem = (id) => {
    setItems(
      items.map((item) => (item.id === id ? { ...item, available: 0 } : item))
    );
  };

  const clearAllData = () => {
    if (
      confirm("Are you sure you want to clear all data? This cannot be undone.")
    ) {
      setItems([]);
      localStorage.removeItem("litematica_items");
    }
  };

  const printShoppingList = () => {
    window.print();
  };

  const stats = items.reduce(
    (acc, item) => {
      acc.totalNeeded += item.total;
      acc.totalCollected += item.available;
      acc.totalMissing += item.total - item.available;
      if (item.available === item.total) acc.completedItems++;
      return acc;
    },
    { totalNeeded: 0, totalCollected: 0, totalMissing: 0, completedItems: 0 }
  );

  const progress =
    items.length > 0 ? (stats.totalCollected / stats.totalNeeded) * 100 : 0;

  const filteredItems = items
    .filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      if (filter === "incomplete")
        return matchesSearch && item.available < item.total;
      if (filter === "complete")
        return matchesSearch && item.available === item.total;
      return matchesSearch;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "missing":
          return b.total - b.available - (a.total - a.available);
        case "progress":
          return a.available / a.total - b.available / b.total;
        default:
          return 0;
      }
    });

  const exportCSV = () => {
    const csv = Papa.unparse(
      items.map((item) => ({
        Item: item.name,
        Total: item.total,
        Missing: item.total - item.available,
        Available: item.available,
        "Total Stacks": formatStacks(item.total),
        "Available Stacks": formatStacks(item.available),
        "Progress %": ((item.available / item.total) * 100).toFixed(1),
      }))
    );

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `litematica-progress-${Date.now()}.csv`;
    a.click();
  };

  // Block icon component with fallback
  const BlockIcon = ({ itemName }) => {
    const [imageError, setImageError] = useState(false);
    const iconUrl = getBlockIconUrl(itemName);
    const fallbackColor = getItemColor(itemName);

    if (imageError) {
      return (
        <div
          className="w-12 h-12 rounded border-4 shrink-0 shadow-lg"
          style={{
            backgroundColor: fallbackColor,
            borderColor: `${fallbackColor}99`,
            boxShadow: `inset 0 0 10px rgba(0,0,0,0.5)`,
          }}
        />
      );
    }

    return (
      <div
        className="w-12 h-12 rounded border-4 border-stone-700 shrink-0 shadow-lg bg-stone-600 overflow-hidden"
        style={{ imageRendering: "pixelated" }}
      >
        <img
          src={iconUrl}
          alt={itemName}
          className="w-full h-full object-contain"
          style={{ imageRendering: "pixelated" }}
          onError={() => setImageError(true)}
        />
      </div>
    );
  };

  // Shopping List Modal
  const ShoppingListModal = () => {
    const incompleteItems = items.filter((item) => item.available < item.total);

    if (!showShoppingList) return null;

    return (
      <>
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #shopping-list, #shopping-list * {
              visibility: visible;
            }
            #shopping-list {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 no-print">
          <div className="bg-stone-800 rounded-lg border-4 border-stone-900 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b-4 border-stone-900 flex items-center justify-between">
              <h2
                className="text-2xl font-bold text-white"
                style={{ fontFamily: "monospace" }}
              >
                SHOPPING LIST
              </h2>
              <button
                onClick={() => setShowShoppingList(false)}
                className="p-2 bg-red-600 hover:bg-red-700 rounded border-2 border-red-900 transition-all"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6" id="shopping-list">
              <div className="bg-white text-black p-8 rounded">
                <h1
                  className="text-3xl font-bold mb-2 text-center"
                  style={{ fontFamily: "monospace" }}
                >
                  MINECRAFT BUILD MATERIALS
                </h1>
                <p className="text-center text-gray-600 mb-6">
                  Items still needed
                </p>

                {incompleteItems.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                    <p className="text-xl font-bold">
                      All materials collected!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {incompleteItems
                      .sort(
                        (a, b) =>
                          b.total - b.available - (a.total - a.available)
                      )
                      .map((item) => {
                        const missing = item.total - item.available;
                        return (
                          <div
                            key={item.id}
                            className="border-2 border-gray-300 rounded p-4 flex items-center gap-4"
                          >
                            <div className="shrink-0">
                              <input type="checkbox" className="w-6 h-6" />
                            </div>
                            <BlockIcon itemName={item.name} />
                            <div className="flex-1">
                              <h3
                                className="font-bold text-lg"
                                style={{ fontFamily: "monospace" }}
                              >
                                {item.name}
                              </h3>
                              <p className="text-gray-600">
                                Need: <strong>{missing}</strong> items (
                                {formatStacks(missing)})
                              </p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold">
                                {missing}
                              </div>
                              <div className="text-sm text-gray-600">
                                {formatStacks(missing)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}

                <div className="mt-8 pt-6 border-t-2 border-gray-300">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-sm text-gray-600">
                        Total Items Needed
                      </div>
                      <div className="text-2xl font-bold">
                        {incompleteItems
                          .reduce(
                            (sum, item) => sum + (item.total - item.available),
                            0
                          )
                          .toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Total Stacks</div>
                      <div className="text-2xl font-bold">
                        {formatStacks(
                          incompleteItems.reduce(
                            (sum, item) => sum + (item.total - item.available),
                            0
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center text-sm text-gray-500">
                  Generated from Litematica Tracker •{" "}
                  {new Date().toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="p-6 border-t-4 border-stone-900 flex gap-3 no-print">
              <button
                onClick={printShoppingList}
                className="flex-1 px-6 py-3 bg-linear-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg border-4 border-blue-900 shadow-lg flex items-center justify-center gap-2 transition-all"
              >
                <Printer className="w-5 h-5 text-white" />
                <span
                  className="font-bold text-white"
                  style={{ fontFamily: "monospace" }}
                >
                  PRINT LIST
                </span>
              </button>
              <button
                onClick={() => setShowShoppingList(false)}
                className="px-6 py-3 bg-linear-to-b from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 rounded-lg border-4 border-gray-900 shadow-lg font-bold text-white transition-all"
                style={{ fontFamily: "monospace" }}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  return (
    <div
      className="min-h-screen bg-linear-to-br from-green-900 via-emerald-900 to-teal-900 p-4 md:p-6 relative"
      style={{
        backgroundImage: `repeating-linear-gradient(0deg, rgba(0,0,0,.1) 0px, transparent 1px, transparent 2px, rgba(0,0,0,.1) 3px),
                        repeating-linear-gradient(90deg, rgba(0,0,0,.1) 0px, transparent 1px, transparent 2px, rgba(0,0,0,.1) 3px)`,
        backgroundSize: "3px 3px",
      }}
    >
      <ShoppingListModal />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-linear-to-r from-stone-800 to-stone-700 rounded-lg p-6 mb-6 border-4 border-stone-900 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-emerald-600 rounded-lg flex items-center justify-center border-4 border-emerald-800 shadow-lg">
              <Package className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1
                className="text-4xl font-bold text-white mb-1"
                style={{
                  fontFamily: "monospace",
                  textShadow: "3px 3px 0 rgba(0,0,0,0.5)",
                }}
              >
                LITEMATICA TRACKER
              </h1>
              <p className="text-stone-300 text-sm">
                Import material lists • Track your progress • Build better
              </p>
            </div>
          </div>
        </div>

        {/* Upload & Export */}
        <div className="bg-stone-800 rounded-lg p-6 mb-6 border-4 border-stone-900 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="cursor-pointer group">
              <div className="border-4 border-dashed border-stone-600 rounded-lg p-6 hover:border-emerald-500 hover:bg-stone-700 transition-all text-center group-hover:scale-[1.02] duration-200">
                <Upload className="w-10 h-10 mx-auto mb-3 text-stone-400 group-hover:text-emerald-400 transition-colors" />
                <div
                  className="text-lg font-bold text-white mb-1"
                  style={{ fontFamily: "monospace" }}
                >
                  UPLOAD CSV FILE
                </div>
                <span className="text-sm text-stone-400">
                  From Litematica material list
                </span>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            </label>

            <div className="grid grid-cols-1 gap-3">
              {items.length > 0 && (
                <>
                  <button
                    onClick={() => setShowShoppingList(true)}
                    className="px-6 py-3 bg-linear-to-b from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 rounded-lg border-4 border-purple-900 shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                  >
                    <Printer className="w-5 h-5 text-white" />
                    <span
                      className="font-bold text-white"
                      style={{ fontFamily: "monospace" }}
                    >
                      SHOPPING LIST
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={exportCSV}
                      className="px-4 py-3 bg-linear-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded-lg border-4 border-blue-900 shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                      <Download className="w-4 h-4 text-white" />
                      <span
                        className="font-bold text-white text-sm"
                        style={{ fontFamily: "monospace" }}
                      >
                        EXPORT
                      </span>
                    </button>

                    <button
                      onClick={clearAllData}
                      className="px-4 py-3 bg-linear-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded-lg border-4 border-red-900 shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                      <Trash2 className="w-4 h-4 text-white" />
                      <span
                        className="font-bold text-white text-sm"
                        style={{ fontFamily: "monospace" }}
                      >
                        CLEAR
                      </span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {items.length > 0 && (
            <div className="mt-4 p-3 bg-stone-700 rounded border-2 border-stone-600 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
              <span className="text-sm text-stone-300 font-mono">
                Progress auto-saved • Changes sync automatically
              </span>
            </div>
          )}
        </div>

        {/* Stats Dashboard */}
        {items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-linear-to-br from-stone-700 to-stone-800 rounded-lg p-5 border-4 border-stone-900 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-amber-600 rounded border-2 border-amber-800 flex items-center justify-center">
                  <Package className="w-6 h-6 text-white" />
                </div>
                <div
                  className="text-sm text-stone-300 font-bold"
                  style={{ fontFamily: "monospace" }}
                >
                  TOTAL NEEDED
                </div>
              </div>
              <div
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: "monospace" }}
              >
                {stats.totalNeeded.toLocaleString()}
              </div>
              <div className="text-sm text-stone-400">
                {formatStacks(stats.totalNeeded)}
              </div>
            </div>

            <div className="bg-linear-to-br from-emerald-700 to-emerald-800 rounded-lg p-5 border-4 border-emerald-900 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-green-500 rounded border-2 border-green-700 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div
                  className="text-sm text-emerald-200 font-bold"
                  style={{ fontFamily: "monospace" }}
                >
                  COLLECTED
                </div>
              </div>
              <div
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: "monospace" }}
              >
                {stats.totalCollected.toLocaleString()}
              </div>
              <div className="text-sm text-emerald-300">
                {formatStacks(stats.totalCollected)}
              </div>
            </div>

            <div className="bg-linear-to-br from-orange-700 to-orange-800 rounded-lg p-5 border-4 border-orange-900 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-red-600 rounded border-2 border-red-800 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div
                  className="text-sm text-orange-200 font-bold"
                  style={{ fontFamily: "monospace" }}
                >
                  MISSING
                </div>
              </div>
              <div
                className="text-3xl font-bold text-white mb-1"
                style={{ fontFamily: "monospace" }}
              >
                {stats.totalMissing.toLocaleString()}
              </div>
              <div className="text-sm text-orange-300">
                {formatStacks(stats.totalMissing)}
              </div>
            </div>

            <div className="bg-linear-to-br from-purple-700 to-purple-800 rounded-lg p-5 border-4 border-purple-900 shadow-xl">
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="text-sm text-purple-200 font-bold"
                  style={{ fontFamily: "monospace" }}
                >
                  PROGRESS
                </div>
              </div>
              <div
                className="text-3xl font-bold text-white mb-2"
                style={{ fontFamily: "monospace" }}
              >
                {progress.toFixed(1)}%
              </div>
              <div className="w-full bg-purple-950 rounded-full h-3 border-2 border-purple-900">
                <div
                  className="bg-linear-to-r from-purple-400 to-pink-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-purple-300 mt-2">
                {stats.completedItems}/{items.length} items complete
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        {items.length > 0 && (
          <div className="bg-stone-800 rounded-lg p-4 mb-6 border-4 border-stone-900 shadow-xl">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-stone-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-stone-700 border-2 border-stone-600 rounded-lg focus:outline-none focus:border-emerald-500 text-white font-mono"
                />
              </div>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 bg-stone-700 border-2 border-stone-600 rounded-lg focus:outline-none focus:border-emerald-500 text-white font-mono font-bold"
              >
                <option value="name">SORT: NAME</option>
                <option value="missing">SORT: MOST NEEDED</option>
                <option value="progress">SORT: PROGRESS</option>
              </select>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-3 bg-stone-700 border-2 border-stone-600 rounded-lg focus:outline-none focus:border-emerald-500 text-white font-mono font-bold"
              >
                <option value="all">SHOW: ALL</option>
                <option value="incomplete">SHOW: INCOMPLETE</option>
                <option value="complete">SHOW: COMPLETE</option>
              </select>
            </div>
          </div>
        )}

        {/* Items List */}
        {filteredItems.length > 0 ? (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const missing = item.total - item.available;
              const itemProgress = (item.available / item.total) * 100;
              const isComplete = item.available === item.total;

              return (
                <div
                  key={item.id}
                  className={`bg-stone-800 rounded-lg p-4 border-4 ${
                    isComplete ? "border-emerald-600" : "border-stone-900"
                  } shadow-xl hover:shadow-2xl transition-all`}
                >
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <BlockIcon itemName={item.name} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3
                              className="font-bold text-lg text-white truncate"
                              style={{ fontFamily: "monospace" }}
                            >
                              {item.name.toUpperCase()}
                            </h3>
                            {isComplete && (
                              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                            )}
                          </div>
                          <div className="flex gap-3 text-sm text-stone-300 font-mono mt-1">
                            <span>Total: {item.total}</span>
                            <span>•</span>
                            <span>Missing: {missing}</span>
                            <span>•</span>
                            <span
                              className={
                                isComplete
                                  ? "text-emerald-400"
                                  : "text-orange-400"
                              }
                            >
                              {itemProgress.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="relative h-6 bg-stone-900 rounded-lg overflow-hidden border-2 border-stone-950">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isComplete
                              ? "bg-linear-to-r from-emerald-500 to-green-500"
                              : "bg-linear-to-r from-orange-500 to-amber-500"
                          }`}
                          style={{ width: `${itemProgress}%` }}
                        />
                        <div
                          className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm"
                          style={{
                            fontFamily: "monospace",
                            textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                          }}
                        >
                          {item.available} / {item.total}
                        </div>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-2 lg:w-80">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-stone-400 font-mono mb-1 block">
                            ITEMS
                          </label>
                          <input
                            type="number"
                            value={item.available}
                            onChange={(e) =>
                              updateAvailable(item.id, e.target.value)
                            }
                            className="w-full px-3 py-2 bg-stone-700 border-2 border-stone-600 rounded-lg focus:outline-none focus:border-emerald-500 text-white font-mono font-bold text-center"
                            min="0"
                            max={item.total}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-stone-400 font-mono mb-1 block">
                            STACKS
                          </label>
                          <input
                            type="number"
                            value={Math.floor(item.available / 64)}
                            onChange={(e) =>
                              updateAvailableStacks(
                                item.id,
                                parseInt(e.target.value) || 0
                              )
                            }
                            className="w-full px-3 py-2 bg-stone-700 border-2 border-stone-600 rounded-lg focus:outline-none focus:border-emerald-500 text-white font-mono font-bold text-center"
                            min="0"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-5 gap-1">
                        <button
                          onClick={() => quickSubtract(item.id, 64)}
                          className="px-2 py-2 bg-linear-to-b from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 rounded border-2 border-red-900 text-white transition-all hover:scale-105 active:scale-95"
                          title="Remove 1 stack"
                        >
                          <Minus className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => quickAdd(item.id, 64)}
                          className="px-2 py-2 bg-linear-to-b from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 rounded border-2 border-blue-900 text-white transition-all hover:scale-105 active:scale-95"
                          title="Add 1 stack"
                        >
                          <Plus className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => markComplete(item.id)}
                          className="px-2 py-2 bg-linear-to-b from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 rounded border-2 border-emerald-900 text-white transition-all hover:scale-105 active:scale-95"
                          title="Mark complete"
                        >
                          <CheckCircle className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() => resetItem(item.id)}
                          className="px-2 py-2 bg-linear-to-b from-orange-600 to-orange-700 hover:from-orange-500 hover:to-orange-600 rounded border-2 border-orange-900 text-white transition-all hover:scale-105 active:scale-95"
                          title="Reset to 0"
                        >
                          <RotateCcw className="w-4 h-4 mx-auto" />
                        </button>
                        <button
                          onClick={() =>
                            setItems(items.filter((i) => i.id !== item.id))
                          }
                          className="px-2 py-2 bg-linear-to-b from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 rounded border-2 border-gray-900 text-white transition-all hover:scale-105 active:scale-95"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 mx-auto" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : items.length === 0 ? (
          <div className="bg-stone-800 rounded-lg p-16 border-4 border-stone-900 text-center shadow-xl">
            <div className="w-24 h-24 bg-stone-700 rounded-lg flex items-center justify-center mx-auto mb-6 border-4 border-stone-900">
              <Package className="w-12 h-12 text-stone-500" />
            </div>
            <h3
              className="text-2xl font-bold text-white mb-2"
              style={{ fontFamily: "monospace" }}
            >
              NO MATERIALS LOADED
            </h3>
            <p className="text-stone-400">
              Upload a Litematica CSV file to start tracking
            </p>
          </div>
        ) : (
          <div className="bg-stone-800 rounded-lg p-16 border-4 border-stone-900 text-center shadow-xl">
            <p className="text-stone-400 text-lg">
              No items match your search or filter
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LitematicaTracker;

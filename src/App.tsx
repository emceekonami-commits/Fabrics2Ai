import { useState, useRef, ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, Sparkles, Download, RefreshCw, ChevronLeft, Send, Loader2 } from "lucide-react";
import { 
  generateFashionDesign, 
  getRandomParams, 
  editFashionDesign 
} from "./services/gemini";

type Page = "landing" | "generator" | "results";

interface GeneratedImage {
  id: string;
  url: string;
  isEditing?: boolean;
  editPrompt?: string;
}

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [fabricImage, setFabricImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFabricUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFabricImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startGeneration = async () => {
    if (!fabricImage) return;
    setIsGenerating(true);
    setError(null);
    setPage("results");
    
    try {
      const promises = [
        generateFashionDesign(fabricImage, getRandomParams()),
        generateFashionDesign(fabricImage, getRandomParams()),
        generateFashionDesign(fabricImage, getRandomParams()),
        generateFashionDesign(fabricImage, getRandomParams())
      ];

      const results = await Promise.all(promises);
      setGeneratedImages(results.map((url, i) => ({ id: `${Date.now()}-${i}`, url })));
    } catch (err) {
      setError("Failed to generate designs. Please try again.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateMore = async () => {
    if (!fabricImage) return;
    setIsGenerating(true);
    try {
      const url = await generateFashionDesign(fabricImage, getRandomParams());
      setGeneratedImages(prev => [...prev, { id: Date.now().toString(), url }]);
    } catch (err) {
      setError("Failed to generate more designs.");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEdit = async (id: string, prompt: string) => {
    const image = generatedImages.find(img => img.id === id);
    if (!image) return;

    setGeneratedImages(prev => prev.map(img => 
      img.id === id ? { ...img, isEditing: true } : img
    ));

    try {
      const newUrl = await editFashionDesign(image.url, prompt);
      setGeneratedImages(prev => prev.map(img => 
        img.id === id ? { ...img, url: newUrl, isEditing: false } : img
      ));
    } catch (err) {
      setError("Failed to edit image.");
      console.error(err);
      setGeneratedImages(prev => prev.map(img => 
        img.id === id ? { ...img, isEditing: false } : img
      ));
    }
  };

  const downloadImage = (url: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = `fashion-design-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans selection:bg-emerald-100">
      <AnimatePresence mode="wait">
        {page === "landing" && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="h-screen flex items-center justify-center p-6 text-center"
          >
            <button
              onClick={() => setPage("generator")}
              className="group relative"
            >
              <h1 className="text-4xl md:text-6xl font-bold tracking-tighter transition-transform group-hover:scale-105 duration-300 font-serif">
                Turn Fabrics to <span className="text-emerald-600 italic">AI Designs</span>
              </h1>
              <p className="mt-4 text-stone-500 font-medium uppercase tracking-widest text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                Tap to start
              </p>
            </button>
          </motion.div>
        )}

        {page === "generator" && (
          <motion.div
            key="generator"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="max-w-md mx-auto min-h-screen flex flex-col p-6 pt-12"
          >
            <button 
              onClick={() => setPage("landing")}
              className="flex items-center text-stone-400 hover:text-stone-600 mb-12 transition-colors"
            >
              <ChevronLeft size={20} />
              <span className="text-sm font-medium">Back</span>
            </button>

            <div className="flex-1 space-y-8">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Upload Fabric</h2>
                <p className="text-stone-500">Select a clear photo of your fabric pattern.</p>
              </div>

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative aspect-square rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden
                  ${fabricImage ? "border-emerald-500 bg-emerald-50" : "border-stone-200 hover:border-stone-300 bg-white shadow-sm"}`}
              >
                {fabricImage ? (
                  <>
                    <img 
                      src={fabricImage} 
                      alt="Uploaded fabric" 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <p className="text-white font-medium">Change Fabric</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-16 h-16 bg-stone-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Upload className="text-stone-400" />
                    </div>
                    <p className="text-stone-600 font-medium">Tap to upload</p>
                    <p className="text-stone-400 text-sm mt-1">PNG, JPG up to 10MB</p>
                  </div>
                )}
                <input 
                  ref={fileInputRef}
                  type="file" 
                  accept="image/*" 
                  onChange={handleFabricUpload} 
                  className="hidden" 
                />
              </div>

              <button
                disabled={!fabricImage || isGenerating}
                onClick={startGeneration}
                className={`w-full py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg
                  ${!fabricImage || isGenerating 
                    ? "bg-stone-200 text-stone-400 cursor-not-allowed shadow-none" 
                    : "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"}`}
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Designs
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}

        {page === "results" && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-md mx-auto min-h-screen p-6 pb-24"
          >
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setPage("generator")}
                className="flex items-center text-stone-400 hover:text-stone-600 transition-colors"
              >
                <ChevronLeft size={20} />
                <span className="text-sm font-medium">Back</span>
              </button>
              <h2 className="text-xl font-bold tracking-tight">Your Designs</h2>
              <div className="w-8" />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-medium">
                {error}
              </div>
            )}

            <div className="space-y-12">
              {isGenerating && generatedImages.length === 0 && (
                <div className="space-y-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="aspect-[3/4] rounded-3xl bg-stone-100 animate-pulse flex items-center justify-center">
                      <Loader2 className="animate-spin text-stone-300" size={32} />
                    </div>
                  ))}
                </div>
              )}

              {generatedImages.map((img) => (
                <motion.div 
                  key={img.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="relative group aspect-[3/4] rounded-3xl overflow-hidden bg-stone-100 shadow-xl border border-stone-200">
                    <img 
                      src={img.url} 
                      alt="Fashion design" 
                      className={`w-full h-full object-cover transition-all duration-500 ${img.isEditing ? "blur-sm scale-105" : ""}`}
                      referrerPolicy="no-referrer"
                    />
                    
                    {img.isEditing && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                        <Loader2 className="animate-spin text-white" size={48} />
                      </div>
                    )}

                    <div className="absolute bottom-4 right-4 flex gap-2">
                      <button 
                        onClick={() => downloadImage(img.url)}
                        className="p-3 bg-white/90 backdrop-blur shadow-lg rounded-xl text-stone-900 hover:bg-white transition-colors"
                      >
                        <Download size={20} />
                      </button>
                    </div>
                  </div>

                  {/* AI Edit Feature */}
                  <div className="relative">
                    <input 
                      type="text"
                      placeholder="Ask AI to edit this design... (e.g. 'add a retro filter')"
                      className="w-full pl-4 pr-12 py-3 bg-white border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleEdit(img.id, (e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = "";
                        }
                      }}
                    />
                    <button 
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-emerald-600 transition-colors"
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        if (input.value) {
                          handleEdit(img.id, input.value);
                          input.value = "";
                        }
                      }}
                    >
                      <Send size={18} />
                    </button>
                  </div>
                </motion.div>
              ))}

              <button
                disabled={isGenerating}
                onClick={generateMore}
                className="w-full py-4 rounded-2xl border-2 border-stone-200 text-stone-600 font-bold flex items-center justify-center gap-2 hover:bg-stone-100 transition-all active:scale-[0.98]"
              >
                {isGenerating ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <RefreshCw size={20} />
                    Generate More Designs
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

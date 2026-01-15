"use client";
import { LearningPath } from '@/lib/api';
import { Calendar, CheckCircle2, PlayCircle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Roadmap({ path }: { path: LearningPath }) {
    if (!path) return null;

    // Group modules by week
    const modulesByWeek: Record<number, typeof path.modules> = {};
    path.modules.forEach(m => {
        if (!modulesByWeek[m.week_number]) modulesByWeek[m.week_number] = [];
        modulesByWeek[m.week_number].push(m);
    });

    return (
        <div className="roadmap-container">
            <div className="flex justify-between items-center mb-8 glass-card">
                <div>
                    <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                        {path.target_role} Roadmap
                    </h2>
                    <p className="text-gray-400">Total Duration: {path.total_weeks} Weeks • {path.total_estimated_hours} Hours</p>
                </div>
                <div className="text-right">
                    <span className="status-badge">AI Generated</span>
                </div>
            </div>

            <div className="timeline">
                {path.modules.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="glass-card text-center p-12"
                    >
                        <div className="text-4xl mb-4">👑</div>
                        <h3 className="text-xl font-bold mb-2">You're already a Master!</h3>
                        <p className="text-gray-400 max-w-md mx-auto">
                            No skill gaps were detected for the <b>{path.target_role}</b> role based on your profile,
                            or we couldn't find specific learning resources for the missing skills yet.
                        </p>
                        <p className="text-indigo-400 text-sm mt-4">
                            Try expanding your role or using the "Scrape" tool to find new content.
                        </p>
                    </motion.div>
                ) : (
                    Object.entries(modulesByWeek).map(([week, modules]) => (
                        <motion.div
                            key={week}
                            className="timeline-item"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                        >
                            <div className="timeline-dot" />
                            <div className="mb-4 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-indigo-400" />
                                <h3 className="text-lg font-semibold">Week {week}</h3>
                                <span className="text-sm text-gray-500 ml-2">({modules[0].start_date})</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                {modules.map(mod => (
                                    <div key={mod.module_id} className="glass-card hover:bg-slate-800/50">
                                        <div className="flex justify-between mb-2">
                                            <h4 className="font-semibold text-lg">{mod.title}</h4>
                                            <span className="text-xs font-mono text-gray-500">{mod.estimated_hours}h</span>
                                        </div>

                                        <p className="text-gray-300 text-sm mb-4">{mod.why_this_module}</p>

                                        {mod.resources.length > 0 && (
                                            <div className="bg-slate-900/50 rounded-lg p-3">
                                                <div className="flex items-center gap-2 mb-2 text-xs uppercase tracking-wide text-gray-500 font-bold">
                                                    <BookOpen className="w-3 h-3" /> Recommended Resource
                                                </div>
                                                {mod.resources.map((res, i) => (
                                                    <a
                                                        key={i}
                                                        href={res.url}
                                                        target="_blank"
                                                        className="flex items-start gap-3 p-2 hover:bg-slate-800 rounded transition-colors"
                                                    >
                                                        <PlayCircle className="w-5 h-5 text-purple-400 mt-1 shrink-0" />
                                                        <div>
                                                            <div className="text-sm font-medium text-indigo-300 hover:underline">
                                                                {res.title}
                                                            </div>
                                                            <div className="text-xs text-gray-500">
                                                                {res.source} {res.social_verified && "• Verified"}
                                                            </div>
                                                        </div>
                                                    </a>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}

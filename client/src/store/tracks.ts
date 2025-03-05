// import { Problem } from "@/types/problems";
// import { toast } from "sonner";
import { create } from "zustand";

// type ProblemStore = {
//     problems: Problem[];
//     addProblem: (problem: Problem) => void;
//     removeProblem: (title: string) => void;
//     loadProblems: (problems: Problem[]) => void;
//     updateProblem: (problem: Problem) => void;
// };

type TracksStore = {
    tracks: [];
    addTrack: (track: any) => void;
    removeTrack: (title: string) => void;
    loadTracks: (tracks: any) => void;
    updateTrack: (track: any) => void;
};

// const useProblemStore = create<ProblemStore>((set) => ({
//     problems: [],
//     addProblem: (problem: Problem) => {
//         set((state) => {
//             const problemExists = state.problems.some(
//                 (p) => p.title.toLowerCase() === problem.title.toLowerCase(), // Or by title
//             );

//             if (problemExists) {
//                 toast.error(`Problem already exists: ${problem.title}`);
//                 return state;
//             }

//             return { problems: [...state.problems, problem] };
//         });
//     },
//     removeProblem: (title: string) => {
//         set((state) => ({
//             problems: state.problems.filter((p) => p.title !== title),
//         }));

//         toast.success(`Problem removed: ${title}`);
//     },
//     loadProblems: (problems: Problem[]) => {
//         set({ problems });
//     },
//     updateProblem: (problem: Problem) => {
//         set((state) => ({
//             problems: state.problems.map((p) =>
//                 p.title === problem.title ? problem : p,
//             ),
//         }));
//     },
// }));

const useTracksStore = create<TracksStore>((set) => ({
    tracks: [],
    addTrack: (track: any) => {
        set((state) => ({
            tracks: [...state.tracks, track],
        }));
    },
    removeTrack: (title: string) => {
        set((state) => ({
            tracks: state.tracks.filter((p) => p.title !== title),
        }));
    },
    loadTracks: (tracks: any) => {
        set({ tracks });
    },
    updateTrack: (track: any) => {
        set((state) => ({
            tracks: state.tracks.map((p) => (p.title === track.title ? track : p)),
        }));
    },
}));

export default useTracksStore


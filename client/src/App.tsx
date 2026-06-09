import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { BugNub } from "./components/BugNub";
import { ProgressProvider } from "./contexts/ProgressContext";
import Home from "./pages/Home";
import LevelMap from "./pages/LevelMap";
import LessonPage from "./pages/LessonPage";
import LetterExplorer from "./pages/LetterExplorer";
import LetterPlay from "./pages/LetterPlay";
import SkillPlay from "./pages/SkillPlay";
import ReviewPlay from "./pages/ReviewPlay";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/levels" component={LevelMap} />
      <Route path="/explore" component={LetterExplorer} />
      <Route path="/lesson/:id" component={LessonPage} />
      <Route path="/play/:lessonId/:letterIndex" component={LetterPlay} />
      <Route path="/skill/:lessonId" component={SkillPlay} />
      <Route path="/review" component={ReviewPlay} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <ProgressProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
            <BugNub />
          </TooltipProvider>
        </ProgressProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;

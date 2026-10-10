import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";

// Top-level tabs
const TOP_LEVEL_PATHS = [
  "/app/dashboard",
  "/app/courses",
  "/app/games",
  "/app/challenges",
  "/app/leaderboard",
  "/app/achievements",
  "/app/mentor",
  "/app/profile",
];

export function useAppBackButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialized = useRef(false);

  // Browser history guard
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      window.history.pushState(
        { bitzyApp: true, path: location.pathname },
        "",
        location.pathname
      );
    }
  }, [location.pathname]);

  // Browser back handling
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      const path = location.pathname;
      const isTopLevel = TOP_LEVEL_PATHS.includes(path);

      if (!isTopLevel) {
        e.preventDefault?.();

        const parent = getParentPath(path);

        navigate(parent, { replace: true });

        window.history.pushState(
          { bitzyApp: true, path: parent },
          "",
          parent
        );

        return;
      }

      if (path !== "/app/dashboard") {
        e.preventDefault?.();

        navigate("/app/dashboard", {
          replace: true,
        });

        window.history.pushState(
          {
            bitzyApp: true,
            path: "/app/dashboard",
          },
          "",
          "/app/dashboard"
        );

        return;
      }

      // On dashboard, keep one history entry so browser does not exit immediately
      window.history.pushState(
        {
          bitzyApp: true,
          path: "/app/dashboard",
        },
        "",
        "/app/dashboard"
      );
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [location.pathname, navigate]);


  // Android hardware back button handling
  useEffect(() => {
    const setupBackButton = async () => {
      const listener = await CapacitorApp.addListener(
        "backButton",
        () => {
          const path = location.pathname;
          const isTopLevel = TOP_LEVEL_PATHS.includes(path);

          // Game, lesson, course details, etc.
          if (!isTopLevel) {
            const parent = getParentPath(path);
            navigate(parent, { replace: true });
            return;
          }

          // Bottom tabs except dashboard
          if (path !== "/app/dashboard") {
            navigate("/app/dashboard", {
              replace: true,
            });
            return;
          }

          // Dashboard -> close app
          CapacitorApp.exitApp();
        }
      );

      return listener;
    };

    let listener: any;

    setupBackButton().then((l) => {
      listener = l;
    });

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [location.pathname, navigate]);
}


// Helper to determine where a back action should go
function getParentPath(path: string): string {
  // Lesson -> Course details
  const lessonMatch = path.match(
    /^\/app\/courses\/([^/]+)\/[^/]+\/[^/]+$/
  );

  if (lessonMatch) {
    return `/app/courses/${lessonMatch[1]}`;
  }

  // Quiz -> Course details
  const quizMatch = path.match(
    /^\/app\/courses\/([^/]+)\/quiz\/[^/]+$/
  );

  if (quizMatch) {
    return `/app/courses/${quizMatch[1]}`;
  }

  // Course details -> Courses page
  if (/^\/app\/courses\/[^/]+$/.test(path)) {
    return "/app/courses";
  }

  // Challenge details -> Challenges page
  if (/^\/app\/challenges\/[^/]+$/.test(path)) {
    return "/app/challenges";
  }

  // Games or unknown pages -> Dashboard
  return "/app/dashboard";
}
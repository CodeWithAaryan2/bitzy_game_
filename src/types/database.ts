export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: number;
          user_id: string;
          display_name: string | null;
          bio: string | null;
          avatar: string | null;
          level: number;
          xp: number;
          coins: number;
          energy: number;
          max_energy: number;
          current_streak: number;
          longest_streak: number;
          last_login_date: string | null;
          role: 'user' | 'admin';
          custom_tag: string | null;
          custom_tag_color: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name?: string | null;
          bio?: string | null;
          avatar?: string | null;
          level?: number;
          xp?: number;
          coins?: number;
          energy?: number;
          max_energy?: number;
          current_streak?: number;
          longest_streak?: number;
          last_login_date?: string | null;
          role?: 'user' | 'admin';
          custom_tag?: string | null;
          custom_tag_color?: string | null;
        };
        Update: {
          display_name?: string | null;
          bio?: string | null;
          avatar?: string | null;
          level?: number;
          xp?: number;
          coins?: number;
          energy?: number;
          max_energy?: number;
          current_streak?: number;
          longest_streak?: number;
          last_login_date?: string | null;
          role?: 'user' | 'admin';
          custom_tag?: string | null;
          custom_tag_color?: string | null;
          updated_at?: string;
        };
      };
      course_progress: {
        Row: {
          id: number;
          user_id: string;
          course_id: number;
          completed_lessons: string[];
          completed_quizzes: string[];
          overall_progress: number;
          last_quiz_id: number | null;
          last_question_index: number;
          last_module_id: number | null;
          last_lesson_slug: string | null;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          course_id: number;
          completed_lessons?: string[];
          completed_quizzes?: string[];
          overall_progress?: number;
          last_quiz_id?: number | null;
          last_question_index?: number;
          last_module_id?: number | null;
          last_lesson_slug?: string | null;
        };
        Update: {
          completed_lessons?: string[];
          completed_quizzes?: string[];
          overall_progress?: number;
          last_quiz_id?: number | null;
          last_question_index?: number;
          last_module_id?: number | null;
          last_lesson_slug?: string | null;
          updated_at?: string;
        };
      };
      game_progress: {
        Row: {
          id: number;
          user_id: string;
          game_name: string;
          current_level: number;
          highest_level: number;
          current_score: number;
          highest_score: number;
          xp_earned: number;
          coins_earned: number;
          last_topic: string | null;
          times_played: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          game_name: string;
          current_level?: number;
          highest_level?: number;
          current_score?: number;
          highest_score?: number;
          xp_earned?: number;
          coins_earned?: number;
          last_topic?: string | null;
          times_played?: number;
        };
        Update: {
          current_level?: number;
          highest_level?: number;
          current_score?: number;
          highest_score?: number;
          xp_earned?: number;
          coins_earned?: number;
          last_topic?: string | null;
          times_played?: number;
          updated_at?: string;
        };
      };
      user_question_progress: {
        Row: {
          id: number;
          user_id: string;
          question_id: string;
          lesson_id: number | null;
          game_name: string | null;
          selected_answer: string | null;
          is_correct: boolean;
          xp_earned: number;
          answered_at: string;
        };
        Insert: {
          user_id: string;
          question_id: string;
          lesson_id?: number | null;
          game_name?: string | null;
          selected_answer?: string | null;
          is_correct?: boolean;
          xp_earned?: number;
        };
        Update: {
          selected_answer?: string | null;
          is_correct?: boolean;
          xp_earned?: number;
        };
      };
      challenge_submissions: {
        Row: {
          id: number;
          user_id: string;
          challenge_id: number;
          status: string;
          source_code: string | null;
          language: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          challenge_id: number;
          status?: string;
          source_code?: string;
          language?: string;
        };
        Update: {
          status?: string;
          source_code?: string;
        };
      };
      achievements: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          icon: string;
          color: string;
          requirement_type: string;
          requirement_count: number;
          xp_reward: number;
          coin_reward: number;
          is_secret: boolean;
        };
      };
      user_achievements: {
        Row: {
          id: number;
          user_id: string;
          achievement_id: string;
          completed: boolean;
          completed_at: string | null;
          progress: number;
        };
        Insert: {
          user_id: string;
          achievement_id: string;
          completed?: boolean;
          completed_at?: string | null;
          progress?: number;
        };
        Update: {
          completed?: boolean;
          completed_at?: string | null;
          progress?: number;
        };
      };
      leaderboard_entries: {
        Row: {
          id: number;
          user_id: string;
          display_name: string;
          level: number;
          xp: number;
          current_streak: number;
          challenges_solved: number;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          display_name: string;
          level?: number;
          xp?: number;
          current_streak?: number;
          challenges_solved?: number;
        };
        Update: {
          display_name?: string;
          level?: number;
          xp?: number;
          current_streak?: number;
          challenges_solved?: number;
          updated_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: number;
          user_id: string;
          activity_type: string;
          description: string;
          xp_earned: number;
          created_at: string;
        };
        Insert: {
          user_id: string;
          activity_type: string;
          description: string;
          xp_earned?: number;
        };
      };
      chat_messages: {
        Row: {
          id: number;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
        };
      };
    };
  };
}

import { PracticeSession } from "@/entities/PracticeSession";
import { Achievement } from "@/entities/Achievement";
import { User } from "@/entities/User";
import { toast } from "@/components/ui/use-toast";

/**
 * Checks and awards achievements to a user based on their practice sessions
 * @param {Object} currentUser - The current user object
 * @returns {Promise<Array>} Array of newly awarded achievements
 */
export async function checkAndAwardAchievements(currentUser) {
  // 1. Get all data
  const [allSessions, allAchievements] = await Promise.all([
    PracticeSession.filter({ created_by: currentUser.email }),
    Achievement.list()
  ]);

  const userAchievements = new Set(currentUser.achievements || []);
  const achievementsToAward = [];

  // 2. Separate session types
  const practiceSessions = allSessions.filter((s) => s.session_type === 'practice');
  const examSessions = allSessions.filter((s) => s.session_type === 'full_exam');
  const passingPracticeSessions = practiceSessions.filter((s) => s.score >= 75);
  const passingExamSessions = examSessions.filter((s) => s.score >= 75);

  // 3. Loop through achievements that the user has NOT yet earned
  for (const ach of allAchievements) {
    if (userAchievements.has(ach.id)) continue; // Skip already earned achievements

    let unlocked = false;

    // 4. Check conditions for each category
    switch (ach.category) {
      case 'completion':
        if (ach.title.toLowerCase().includes('practice') && practiceSessions.length >= ach.requirement) {
          unlocked = true;
        } else if (ach.title.toLowerCase().includes('exam') && examSessions.length >= ach.requirement) {
          unlocked = true;
        }
        break;

      case 'milestone':
        if (ach.title.toLowerCase().includes('first pass')) {
          if (passingPracticeSessions.length >= 1 || passingExamSessions.length >= 1) {
            unlocked = true;
          }
        } else if (ach.title.toLowerCase().includes('perfect')) {
          const perfectSessions = allSessions.filter((s) => s.score >= 100);
          if (perfectSessions.length >= ach.requirement) unlocked = true;
        } else if (ach.title.toLowerCase().includes('excellence')) {
          const excellentSessions = allSessions.filter((s) => s.score >= 90);
          if (excellentSessions.length >= ach.requirement) unlocked = true;
        }
        break;

      case 'streak':
        // Current streak logic is handled on the dashboard and is complex.
        // This check assumes a separate logic calculates and stores the user's streak.
        break;

      case 'hours':
        const totalHours = currentUser.total_hours_trained || 0;
        if (totalHours >= ach.requirement) unlocked = true;
        break;

      case 'reading':
      case 'listening':
      case 'speaking':
      case 'writing':
        const passedMasterySessions = allSessions.filter((s) => s.exam_section === ach.category && s.score >= 75);
        if (passedMasterySessions.length >= ach.requirement) {
          unlocked = true;
        }
        break;
    }

    // 5. Award achievement
    if (unlocked) {
      achievementsToAward.push(ach);
      userAchievements.add(ach.id);
    }
  }

  // 6. Update user if new achievements were found
  if (achievementsToAward.length > 0) {
    await User.updateMyUserData({ achievements: Array.from(userAchievements) });
    achievementsToAward.forEach((ach, index) => {
      setTimeout(() => {
        toast({
          title: "🎉 Achievement Unlocked!",
          description: `${ach.title} - ${ach.description}`,
          duration: 5000,
        });
      }, index * 1000); // Stagger toasts to prevent them from overlapping
    });
  }

  return achievementsToAward;
}
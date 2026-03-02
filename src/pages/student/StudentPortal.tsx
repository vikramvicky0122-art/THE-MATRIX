import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/services/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Search } from "lucide-react";
import SeatAllocationView, { SeatAllocationViewProps } from "@/components/student/SeatAllocationView";
import { Tables } from "@/integrations/supabase/types";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Student Portal Component
 * This component allows students to verify their exam hall and seat allocation
 * by inputting their Exam Code and Registration Number.
 */
const Student = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  // State to handle the loading spinner during database inquiries
  const [loading, setLoading] = useState(false);

  // State to store available subjects for a specific exam code
  const [subjects, setSubjects] = useState<Tables<"subjects">[]>([]);

  // State to manage the user's input data in the search form
  const [searchData, setSearchData] = useState({
    examCode: "",
    registrationNumber: "",
    subjectId: "",
  });

  // State to hold the final seat allocation result if successfully found
  const [allocation, setAllocation] = useState<SeatAllocationViewProps["allocation"] | null>(null);

  /**
   * Effect hook to automatically fetch available subjects from the database whenever
   * the user inputs a valid exam code. This helps populate the subject selection dropdown.
   */
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        // First, verify if the entered exam code actually exists
        const { data: exam } = await supabase
          .from("exams")
          .select("id")
          .eq("exam_code", searchData.examCode)
          .maybeSingle();

        if (!exam) return; // Exit silently if exam code doesn't match anything yet

        // Fetch subjects linked to this specific exam
        const { data, error } = await supabase
          .from("subjects")
          .select("*")
          .eq("exam_id", exam.id);

        if (error) throw error;
        setSubjects(data || []);
      } catch (error) {
        console.error("Failed to fetch subjects");
      }
    };

    if (searchData.examCode) {
      fetchSubjects();
    }
  }, [searchData.examCode]); // Dependency array: run this whenever examCode changes

  /**
   * Processes the search form submission. Validates inputs, searches Supabase for
   * the specific student's allocation, and retrieves the overall hall layout.
   */
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Basic input validation: ensure fields aren't just empty spaces
      if (!searchData.examCode.trim() || !searchData.registrationNumber.trim()) {
        toast.error(t("enter.both"));
        return;
      }

      // Step 1: Find the actual Exam record based on the provided Exam Code
      const { data: exam, error: examError } = await supabase
        .from("exams")
        .select("*")
        .eq("exam_code", searchData.examCode)
        .single();

      if (examError || !exam) {
        toast.error(t("exam.not.found"));
        return;
      }

      // Step 2: Build and execute the query for this specific student's seat allocation
      // We also join with the "halls" table to grab hall details like name and capacity in one trip.
      const query = supabase
        .from("seat_allocations")
        .select(`
          *,
          halls(*)
        `)
        .eq("exam_id", exam.id)
        .eq("registration_number", searchData.registrationNumber);



      const { data: seatData, error: seatError } = await query.maybeSingle();

      if (seatError || !seatData) {
        toast.error(t("seat.not.found"));
        return;
      }

      // Step 3: Get all allocations for the entire hall context. 
      // This is necessary to visually render the grid of surrounding seats.
      const hallQuery = supabase
        .from("seat_allocations")
        .select("*")
        .eq("hall_id", seatData.hall_id)
        .order("seat_number");



      const { data: hallAllocations, error: hallError } = await hallQuery;

      if (hallError) throw hallError;

      // Bundle all the gathered information into state to switch the view
      setAllocation({
        exam,
        student: seatData,
        hall: seatData.halls,
        allSeats: hallAllocations || [],
      });

      toast.success(t("seat.found"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to find seat allocation";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears out all search and allocation data, returning the user back to the empty search form.
   */
  const handleReset = () => {
    setAllocation(null);
    setSearchData({ examCode: "", registrationNumber: "", subjectId: "" });
    setSubjects([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation Button */}
        <Button variant="ghost" onClick={() => navigate("/")} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t("back.home")}
        </Button>

        {/* Conditional Rendering: Show Search Form if no allocation is found, else show the Result View */}
        {!allocation ? (
          <Card className="max-w-md mx-auto p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">{t("find.seat")}</h1>
              <p className="text-muted-foreground">
                {t("enter.details")}
              </p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <Label htmlFor="examCode">{t("exam.code")}</Label>
                <Input
                  id="examCode"
                  placeholder="e.g., EXM1025"
                  value={searchData.examCode}
                  onChange={(e) =>
                    setSearchData({ ...searchData, examCode: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="registrationNumber">{t("reg.number")}</Label>
                <Input
                  id="registrationNumber"
                  placeholder="e.g., 2021001"
                  value={searchData.registrationNumber}
                  onChange={(e) =>
                    setSearchData({
                      ...searchData,
                      registrationNumber: e.target.value,
                    })
                  }
                  required
                />
              </div>

              {/* Subject Selection Dropdown - Only appears if the typed exam code matches subjects in the DB */}
              {subjects.length > 0 && (
                <div>
                  <Label htmlFor="subject">{t("subject")}</Label>
                  <Select
                    value={searchData.subjectId || "all"}
                    onValueChange={(value) =>
                      setSearchData({ ...searchData, subjectId: value === "all" ? "" : value })
                    }
                  >
                    <SelectTrigger id="subject">
                      <SelectValue placeholder={t("all.subjects")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t("all.subjects")}</SelectItem>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>
                          {subject.subject_name} {subject.subject_code && `(${subject.subject_code})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                <Search className="mr-2 h-5 w-5" />
                {loading ? t("searching") : t("student.find")}
              </Button>
            </form>
          </Card>
        ) : (
          <SeatAllocationView allocation={allocation} onReset={handleReset} />
        )}
      </div>
    </div>
  );
};

export default Student;

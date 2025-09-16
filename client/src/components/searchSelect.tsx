import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectValue,
  SelectItem,
  SelectGroup,
} from "./ui/select";

interface SearchSelectProps {
  value: string;
  onChange: (value: "yt-api" | "yt-search") => void;
  triggerClassName?: string;
}
export const SearchSelect = ({
  value,
  onChange,
  triggerClassName,
}: SearchSelectProps) => {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className={cn("sm:w-fit w-10", triggerClassName)}>
        <SelectValue placeholder="Select search type" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="yt-api">Youtube API</SelectItem>
          <SelectItem value="yt-search">Basic Search</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

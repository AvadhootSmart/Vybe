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
}
export const SearchSelect = ({ value, onChange }: SearchSelectProps) => {
  return (
    <Select onValueChange={onChange} value={value}>
      <SelectTrigger className="sm:w-fit w-10">
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

import { useState, type FormEvent } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { useProjectStore } from "../../state/projectStore";
import type { Person } from "../../types/planning";
import { Button } from "../ui/Button";
import { useDialog } from "../ui/DialogProvider";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";

type EntityKind = NonNullable<Person["kind"]>;

const ENTITY_KIND_OPTIONS: EntityKind[] = ["person", "organization"];

function emptyEntityForm() {
  return {
    name: "",
    initials: "",
    kind: "person" as EntityKind,
  };
}

function formatEntityKind(kind: EntityKind) {
  return kind === "organization" ? "Organization" : "Person";
}

function normalizeInitialsInput(value: string) {
  return value.toUpperCase().slice(0, 3);
}

export function SettingsPage() {
  const dialog = useDialog();
  const { project, addAssociatedEntity, updateAssociatedEntity, removeAssociatedEntity } = useProjectStore();
  const [newEntity, setNewEntity] = useState(emptyEntityForm);

  function handleAddEntity(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newEntity.name.trim()) {
      return;
    }

    addAssociatedEntity(newEntity);
    setNewEntity(emptyEntityForm());
  }

  async function handleRemoveEntity(person: Person) {
    if (
      await dialog.confirm({
        title: "Remove association",
        message: `Remove "${person.name}" from settings and all associated lists? A snapshot will be created first.`,
        confirmLabel: "Remove",
        danger: true,
      })
    ) {
      removeAssociatedEntity(person.id);
    }
  }

  return (
    <section className="settings-page" aria-label="Settings">
      <div className="settings-page__header">
        <h2>Settings</h2>
      </div>

      <section className="settings-panel" aria-label="Add person or organization">
        <form className="settings-form" aria-label="Add person or organization" onSubmit={handleAddEntity}>
          <Input
            aria-label="Name"
            placeholder="Name"
            value={newEntity.name}
            onChange={(event) => setNewEntity((current) => ({ ...current, name: event.target.value }))}
          />
          <Input
            aria-label="Initials"
            placeholder="Initials"
            maxLength={3}
            value={newEntity.initials}
            onChange={(event) =>
              setNewEntity((current) => ({ ...current, initials: normalizeInitialsInput(event.target.value) }))
            }
          />
          <Select
            aria-label="Type"
            value={newEntity.kind}
            onChange={(event) =>
              setNewEntity((current) => ({ ...current, kind: event.target.value as EntityKind }))
            }
          >
            {ENTITY_KIND_OPTIONS.map((kind) => (
              <option key={kind} value={kind}>
                {formatEntityKind(kind)}
              </option>
            ))}
          </Select>
          <div className="settings-row-actions">
            <Button type="submit" variant="primary">
              <Plus size={15} aria-hidden="true" />
              Add
            </Button>
          </div>
        </form>
      </section>

      <section className="settings-panel" aria-label="People and organizations">
        <div className="settings-entity-list">
          {project.people.map((person) => (
            <form
              key={person.id}
              className="settings-entity-row"
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                updateAssociatedEntity(person.id, {
                  name: String(formData.get("name") ?? ""),
                  initials: String(formData.get("initials") ?? ""),
                  kind: String(formData.get("kind") ?? "person") as EntityKind,
                });
              }}
            >
              <Input name="name" aria-label={`${person.name} name`} defaultValue={person.name} />
              <Input
                name="initials"
                aria-label={`${person.name} initials`}
                defaultValue={person.initials}
                maxLength={3}
                onInput={(event) => {
                  event.currentTarget.value = normalizeInitialsInput(event.currentTarget.value);
                }}
              />
              <Select name="kind" aria-label={`${person.name} type`} defaultValue={person.kind ?? "person"}>
                {ENTITY_KIND_OPTIONS.map((kind) => (
                  <option key={kind} value={kind}>
                    {formatEntityKind(kind)}
                  </option>
                ))}
              </Select>
              <div className="settings-row-actions">
                <Button type="submit">
                  <Save size={15} aria-hidden="true" />
                  Save
                </Button>
                <Button type="button" variant="danger" onClick={() => handleRemoveEntity(person)}>
                  <Trash2 size={15} aria-hidden="true" />
                  Remove
                </Button>
              </div>
            </form>
          ))}
        </div>
      </section>
    </section>
  );
}

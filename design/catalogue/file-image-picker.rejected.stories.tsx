import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileTrigger } from "react-aria-components";
import { Button, ButtonGroup, Form, Heading, InlineAlert, Text } from "@bcgov/design-system-react-components";

// file-image-picker · rejected — the vendor chose "portrait.gif" through the chooser's "all files" option and saved.
// The picture is refused because its name does not end in .jpg, .jpeg or .png (R-8.30); a file whose name is allowed
// but whose content is not a JPEG or PNG image is refused in the same place (R-8.21). Nothing is stored, the stored
// picture is kept, and the rest of the form keeps what was typed. Focus moves to the message.
const meta: Meta = { title: "files/file-image-picker/rejected" };
export default meta;

const page = { display: "grid", gap: "var(--layout-margin-large)", padding: "var(--layout-padding-large)" } as const;
const stack = { display: "grid", gap: "var(--layout-margin-medium)" } as const;
const picture = { display: "grid", gap: "var(--layout-margin-small)", justifyItems: "start" } as const;
const image = { maxWidth: "100%", height: "auto" } as const;

export const Rejected: StoryObj = {
  render: () => (
    <div style={page}>
      <Heading level={1}>User Profile</Heading>
      <Form validationBehavior="aria" style={stack}>
        <div role="group" aria-labelledby="picture-label" style={picture}>
          <Text elementType="p" id="picture-label">Profile picture (optional)</Text>
          <img
            src="/api/files/5b2e0c3a-8d41-4f6e-a1c2-000000000805?type=blob"
            alt="Your current profile picture"
            style={image}
            data-testid="profile-image"
          />
          <div data-testid="image-rejected-error" tabIndex={-1}>
            <InlineAlert variant="danger" role="alert" title="portrait.gif cannot be used as a profile picture">
              <Text elementType="p">
                Choose a JPEG or PNG image. Its name must end in .jpg, .jpeg or .png. Your current picture has been kept.
              </Text>
            </InlineAlert>
          </div>
          <div id="image-file-rule" data-testid="image-file-rule">
            <Text elementType="p" size="small" color="secondary">
              A JPEG or PNG image, up to 10 MB. A picture wider or taller than 500 pixels is made smaller to fit, keeping its
              proportions. Anyone can see your profile picture, including people who are not signed in.
            </Text>
          </div>
          <FileTrigger acceptedFileTypes={["image/jpeg", "image/png"]}>
            <Button variant="secondary" aria-describedby="image-file-rule" data-testid="change-avatar">
              Choose a different profile picture
            </Button>
          </FileTrigger>
        </div>
        <Text elementType="p" size="small" color="secondary">
          Sign-in username, name and email address follow. They are the users domain's design and are not shown here.
        </Text>
        <ButtonGroup ariaLabel="Profile actions">
          <Button type="submit" variant="primary">Save changes</Button>
          <Button variant="secondary">Cancel</Button>
        </ButtonGroup>
      </Form>
    </div>
  ),
};

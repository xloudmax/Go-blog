package models

type MechanismNode struct {
	ID       string           `json:"id"`
	Label    string           `json:"label"`
	Note     *string          `json:"note,omitempty"`
	Children []*MechanismNode `json:"children,omitempty"`
}
